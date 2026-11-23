// Entry point of the WebGL film. Loaded on demand by CampaignFilm, so three.js
// never weighs on the first paint of the landing page.

import {
  Color,
  FogExp2,
  HalfFloatType,
  MathUtils,
  Mesh,
  PlaneGeometry,
  Scene,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { DURATION, STILL_AT, finaleAt } from "./film";
import { backdropMaterial, shared } from "./materials";
import { hex } from "./palette";
import { Rig, type FocusRect } from "./rig";
import { createShell } from "./shell";
import { Signal } from "./signal";
import { createDocStation } from "./stations/docStation";
import { createGatewayStation } from "./stations/gatewayStation";
import { createHallStation } from "./stations/hallStation";
import { createHeapStation } from "./stations/heapStation";
import { createIndexStation } from "./stations/indexStation";
import { createPhoneStation } from "./stations/phoneStation";
import { createVectorStation } from "./stations/vectorStation";
import { TextureKit } from "./textures";
import type { Frame, Kit, Station } from "./world";

export interface FilmOptions {
  /** Start paused on a still of the whole stack instead of playing. */
  startPaused: boolean;
  /** Called once the first frame is on screen. */
  onReady(): void;
  /** Called with the film time, in seconds, of every frame drawn. */
  onTime(t: number): void;
}

export interface FilmController {
  /** Plays or pauses the film. Pausing stops the frame loop altogether. */
  setPlaying(playing: boolean): void;
  /** Jumps to a point in the film, in seconds. */
  seek(t: number): void;
  /** Pointer position relative to the viewport centre, -1..1 on each axis. */
  setPointer(x: number, y: number): void;
  /** Area of the canvas not covered by copy, in CSS pixels. */
  setFocus(rect: FocusRect): void;
  /**
   * Pauses, jumps to a film time (and optionally a point in the ambient
   * clock) and draws one frame. For automated visual checks, which cannot
   * wait on a frame loop that browsers throttle in background tabs.
   */
  drawAt(t: number, clock?: number): void;
  dispose(): void;
}

/**
 * Builds the scene inside `host`. The canvas is created here rather than passed
 * in: disposing a renderer loses its WebGL context for good, so every scene
 * instance needs a canvas of its own.
 */
export function createFilm(host: HTMLElement, options: FilmOptions): FilmController {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  try {
    return build(canvas, options);
  } catch (error) {
    canvas.remove();
    throw error;
  }
}

function build(canvas: HTMLCanvasElement, options: FilmOptions): FilmController {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const low =
    coarse || Math.min(window.innerWidth, window.innerHeight) < 640 || (navigator.hardwareConcurrency ?? 8) <= 4;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: low,
    alpha: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(hex.bg, 1);
  // Rendered pixels are capped so a large 2x display does not quadruple the
  // fill cost: sharp enough for hairlines, bounded for integrated GPUs.
  const pixelBudget = low ? 1.5e6 : 2.8e6;
  let pixelCap = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2);
  let pixelRatio = pixelCap;

  const scene = new Scene();
  scene.background = new Color(hex.bg);
  const fog = new FogExp2(0x000000, 0.02);
  scene.fog = fog;

  const backdrop = backdropMaterial();
  const backdropMesh = new Mesh(new PlaneGeometry(2, 2), backdrop);
  backdropMesh.frustumCulled = false;
  backdropMesh.renderOrder = -1000;
  scene.add(backdropMesh);

  const signal = new Signal();
  const kit: Kit = {
    tex: new TextureKit(
      Math.min(8, renderer.capabilities.getMaxAnisotropy()),
      window.getComputedStyle(document.body).fontFamily || "system-ui, sans-serif",
      low ? 0.6 : 1,
    ),
    signal,
    low,
    compact: window.innerWidth < 1024,
  };

  const rig = new Rig(signal);
  const shell = createShell(kit);
  const stations: Station[] = [
    createPhoneStation(kit),
    createDocStation(kit),
    createHallStation(kit),
    createGatewayStation(kit),
    createVectorStation(kit),
    createIndexStation(kit),
    createHeapStation(kit),
    shell,
  ];
  for (const station of stations) scene.add(station.group);

  /* Post-processing: bloom on capable devices, plain rendering otherwise. */
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (!low) {
    const target = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, rig.camera));
    bloom = new UnrealBloomPass(new Vector2(4, 4), 0.44, 0.62, 0.9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  let width = 0;
  let height = 0;
  let focused = false;
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0 || (w === width && h === height)) return false;
    width = w;
    height = h;
    pixelRatio = Math.max(1, Math.min(pixelCap, Math.sqrt(pixelBudget / (w * h))));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    if (composer) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(w, h);
    }
    rig.resize(w, h);
    backdrop.uniforms.uAspect.value = w / h;
    if (!focused) backdrop.uniforms.uGlowPos.value.set(w >= 1024 ? 0.7 : 0.5, w >= 1024 ? 0.48 : 0.64);
    return true;
  };

  /* The film's state: where it is, whether it runs, how often it has looped. */
  let t = options.startPaused ? STILL_AT : 0;
  let playing = !options.startPaused;
  let loop = 0;
  let clock = options.startPaused ? 4.6 : 0;
  let ready = false;
  const frame: Frame = { t: 0, time: 0, dt: 0, loop: 0, finale: 0 };

  const draw = (dt: number) => {
    frame.t = t;
    frame.time = clock;
    frame.dt = dt;
    frame.loop = loop;
    frame.finale = finaleAt(t);
    rig.update(t, clock, dt, frame.finale, !playing);
    shared.time.value = clock;
    shared.fogDensity.value = rig.fog;
    fog.density = rig.fog;
    shared.pointScale.value =
      (height * pixelRatio) / (2 * Math.tan(MathUtils.degToRad(rig.camera.fov) / 2));
    for (const station of stations) station.update(frame);
    backdrop.uniforms.uGlow.value.copy(shell.glow);
    if (composer) composer.render(dt);
    else renderer.render(scene, rig.camera);
    options.onTime(t);
    if (!ready) {
      ready = true;
      options.onReady();
    }
  };

  /* Frame loop: runs only while playing, on screen and in a visible tab. */
  let raf = 0;
  let last = 0;
  let onScreen = true;
  let slowFrames = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt;
    t += dt;
    if (t >= DURATION) {
      t -= DURATION;
      loop += 1;
    }
    resize();
    draw(dt);

    // Shed work if the device cannot keep up: bloom first, then resolution.
    slowFrames = dt > 0.03 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
    if (slowFrames > 70) {
      slowFrames = 0;
      if (composer) {
        composer.dispose();
        composer = null;
        bloom = null;
      } else if (pixelCap > 1) {
        pixelCap = Math.max(1, pixelRatio - 0.4);
        width = 0;
      }
    }
  };
  const start = () => {
    if (!playing || raf || !onScreen || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  // Paused: no loop at all, one frame whenever something changes.
  const renderOnce = () => {
    if (playing) return;
    resize();
    draw(0);
  };

  const visibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", visibility);
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) start();
    else stop();
  });
  observer.observe(canvas);
  const resizeObserver = new ResizeObserver(() => {
    if (!playing) {
      width = 0;
      renderOnce();
    }
  });
  resizeObserver.observe(canvas);

  const lost = (event: Event) => {
    event.preventDefault();
    stop();
  };
  const restored = () => {
    width = 0;
    if (playing) start();
    else renderOnce();
  };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);

  // Upload every texture up front so a scene does not hitch the first time
  // the camera reaches it.
  for (const texture of kit.tex.all) renderer.initTexture(texture);
  resize();
  if (playing) start();
  else renderOnce();

  return {
    setPlaying(value: boolean) {
      if (value === playing) return;
      playing = value;
      if (playing) start();
      else {
        stop();
        renderOnce();
      }
    },
    seek(value: number) {
      t = MathUtils.clamp(value, 0, DURATION - 1e-3);
      renderOnce();
    },
    setPointer(x: number, y: number) {
      rig.setPointer(x, y);
    },
    drawAt(value: number, at?: number) {
      playing = false;
      stop();
      t = MathUtils.clamp(value, 0, DURATION);
      loop = 0;
      if (at !== undefined) clock = at;
      resize();
      draw(0);
    },
    setFocus(rect: FocusRect) {
      focused = true;
      rig.setFocus(rect);
      if (width > 0 && height > 0) {
        backdrop.uniforms.uGlowPos.value.set(
          (rect.x + rect.width / 2) / width,
          1 - (rect.y + rect.height / 2) / height,
        );
      }
      renderOnce();
    },
    dispose() {
      stop();
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      scene.traverse((object: Object3D) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as Material | Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      kit.tex.dispose();
      composer?.dispose();
      bloom?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
