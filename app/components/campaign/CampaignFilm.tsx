"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import styles from "./CampaignFilm.module.css";
import { narration } from "./filmContent";
import type { FilmController } from "./scene";
import { DURATION, SHOTS, STILL_AT, shotIndexAt } from "./scene/film";
import { withBasePath } from "../../services/sitePath";

type Mode = "poster" | "film" | "static";

interface CampaignLink {
  label: string;
  href: string;
}

/**
 * Pages may supply copy and links, or a prompt panel in their place.
 * The film and narration stay the same in either layout.
 */
export interface CampaignFilmProps {
  tagline: string;
  heading: string;
  description: string;
  primary: CampaignLink;
  secondary: CampaignLink;
  children?: ReactNode;
}

/** Below this viewport height the stage cannot hold both the copy and the film. */
const MIN_FILM_HEIGHT = 560;

function debugWindow() {
  return window as unknown as { __campaignFilm?: FilmController };
}

function supportsWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** The film in words: what each shot shows, for when it cannot or should not play. */
function FilmSteps({ className }: { className: string }) {
  return (
    <ol className={className}>
      {narration.map((caption, index) => (
        <li key={caption.shot} className={styles.stepItem}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-300 sm:text-sm">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">{caption.title}</h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-gray-300 sm:text-lg">{caption.text}</p>
          <ul className={styles.facts}>
            {caption.facts.map((fact) => (
              <li key={fact} className={styles.fact}>
                {fact}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export default function CampaignFilm({ tagline, heading, description, primary, secondary, children }: CampaignFilmProps) {
  const promptLayout = Boolean(children);
  const [mode, setMode] = useState<Mode>("poster");
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState(shotIndexAt(STILL_AT));
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const loading = mode === "film" && !ready;

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const controller = useRef<FilmController | null>(null);
  const shotRef = useRef(shotIndexAt(STILL_AT));

  /* Short viewports keep the written story; WebGL is checked only on Play. */
  useEffect(() => {
    setHydrated(true);
    const decide = () => {
      if (window.innerHeight < MIN_FILM_HEIGHT) {
        setMode("static");
        setPlaying(false);
        setStill(true);
      }
    };
    decide();
    // A stage that no longer fits (a phone turned sideways) falls back for
    // good; switching back and forth would move the reader around.
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  /**
   * Tells the scene which part of the stage is free of copy, so the camera can
   * frame its subject there: beside the copy on wide screens, above it on
   * narrow ones.
   */
  const reportFocus = useCallback(() => {
    const stage = stageRef.current;
    const topbar = topbarRef.current;
    const copy = copyRef.current;
    const player = playerRef.current;
    const root = rootRef.current;
    if (!stage || !topbar || !copy || !player || !root) return;
    const box = stage.getBoundingClientRect();
    const top = topbar.getBoundingClientRect().bottom - box.top + 12;
    const bottom = player.getBoundingClientRect().top - box.top - 8;
    const left = copy.getBoundingClientRect().right - box.left - 10;
    const focus = box.width >= 1024
      ? { x: left, y: top, width: box.width - left - 24, height: bottom - top }
      : {
        x: 8,
        y: top,
        width: box.width - 16,
        height: Math.max(bottom - top, promptLayout ? 1 : box.height * 0.3),
      };
    const posterWidth = Math.max(1, Math.min(focus.width, focus.height * 640 / 569));
    const posterHeight = posterWidth * 569 / 640;
    root.style.setProperty("--film-focus-left", `${focus.x + (focus.width - posterWidth) / 2}px`);
    root.style.setProperty("--film-focus-top", `${focus.y + (focus.height - posterHeight) / 2}px`);
    root.style.setProperty("--film-focus-width", `${posterWidth}px`);
    root.style.setProperty("--film-focus-height", `${posterHeight}px`);
    controller.current?.setFocus(focus);
  }, [promptLayout]);

  /* The stage fills what is left of the first viewport under the site's header. */
  useEffect(() => {
    if (mode === "static") return;
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const top = Math.max(0, Math.round(root.getBoundingClientRect().top + window.scrollY));
      root.style.setProperty("--film-top", `${top}px`);
      reportFocus();
    };
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    if (copyRef.current) observer.observe(copyRef.current);
    if (playerRef.current) observer.observe(playerRef.current);
    measure();
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [mode, reportFocus]);

  /* Entering film mode requires an explicit Play click. */
  useEffect(() => {
    if (mode !== "film") return;
    const host = sceneRef.current;
    const root = rootRef.current;
    if (!host || !root) return;
    let cancelled = false;
    let created: FilmController | null = null;

    const onTime = (t: number) => {
      // The progress line moves every frame, so it bypasses React.
      root.style.setProperty("--film-progress", (t / DURATION).toFixed(4));
      const index = shotIndexAt(t);
      if (index !== shotRef.current) {
        shotRef.current = index;
        setShot(index);
      }
    };

    const build = async () => {
      try {
        // Canvas textures bake text in, so the page font has to be loaded.
        await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
        if (cancelled) return;
        const { createFilm } = await import("./scene");
        if (cancelled) return;
        created = createFilm(host, {
          startPaused: true,
          onReady: () => setReady(true),
          onTime,
        });
        controller.current = created;
        reportFocus();
        created.seek(0);
        created.setPlaying(true);
        // Development builds expose the controller for visual checks.
        if (process.env.NODE_ENV !== "production") debugWindow().__campaignFilm = created;
      } catch (error) {
        console.warn("Campaign film unavailable; showing the static page instead.", error);
        if (!cancelled) {
          setPlaying(false);
          setStill(true);
          setMode("static");
        }
      }
    };
    void build();

    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      controller.current?.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      );
    };
    window.addEventListener("pointermove", pointer, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", pointer);
      created?.dispose();
      controller.current = null;
      if (process.env.NODE_ENV !== "production") delete debugWindow().__campaignFilm;
      setReady(false);
    };
  }, [mode, reportFocus]);

  const toggle = () => {
    if (mode === "poster") {
      if (!supportsWebGL2()) {
        setMode("static");
        return;
      }
      setPlaying(true);
      setStill(false);
      setMode("film");
      return;
    }
    const next = !playing;
    if (next && still) {
      // Leaving the still frame: start the film from its first shot.
      controller.current?.seek(0);
      setStill(false);
    }
    controller.current?.setPlaying(next);
    setPlaying(next);
  };

  return (
    <section
      ref={rootRef}
      aria-labelledby="hero-heading"
      className={styles.root}
      data-layout={children ? "prompt" : undefined}
      data-mode={mode}
      data-shot={SHOTS[shot].key}
      data-playing={playing}
      style={{ "--film-progress": STILL_AT / DURATION } as CSSProperties}
    >
      <div ref={stageRef} className={styles.stage}>
        <div aria-hidden="true" className={styles.backdrop} />
        <div aria-hidden="true" className={styles.poster} data-hidden={ready}>
          <Image src={withBasePath("/images/campaign-film-poster.webp")} alt="" fill unoptimized
            sizes="(max-width: 1023px) 100vw, 50vw" loading="eager" fetchPriority="low" />
        </div>
        <div ref={sceneRef} aria-hidden="true" className={styles.scene} data-ready={ready} />
        <div aria-hidden="true" className={styles.scrim} />

        <div className={styles.frame}>
          {/* Clear space under the site header; the film is framed below it. */}
          <div ref={topbarRef} className={styles.topbar} />

          <div ref={copyRef} className={styles.copy}>
            {children || <>
            <p className="mb-3 text-xs font-medium text-emerald-300 sm:mb-4 sm:text-sm">{tagline}</p>
            <h1 id="hero-heading" className={styles.heading}>
              {heading}
            </h1>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-gray-300 sm:mt-5 sm:text-lg">{description}</p>
            <div className={styles.buttons}>
              <a
                href={primary.href}
                data-campaign-link="primary"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-xl bg-sky-300 px-3 py-2.5 text-center text-sm font-semibold text-neutral-950 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 sm:px-6 sm:py-4 sm:text-base"
              >
                {primary.label}
              </a>
              <a
                href={secondary.href}
                data-campaign-link="secondary"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-xl border border-neutral-600 bg-neutral-900/80 px-3 py-2.5 text-center text-sm font-semibold text-white backdrop-blur transition hover:border-sky-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 sm:px-6 sm:py-4 sm:text-base"
              >
                {secondary.label}
              </a>
            </div>
            </>}
          </div>

          {/* Narration and the playback control. */}
          <div ref={playerRef} className={styles.player} data-film-player="">
            <button
              type="button"
              className={styles.toggle}
              aria-label={loading ? "Loading animation" : playing ? "Pause the animation" : "Play the animation"}
              aria-busy={loading}
              disabled={loading}
              onClick={toggle}
            >
              <svg className={styles.toggleIcon} viewBox="0 0 12 12" aria-hidden="true">
                {playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M2.5 1 11 6l-8.5 5z" />}
              </svg>
            </button>
            <div aria-hidden="true" className={styles.captions}>
              {loading && <p className={styles.caption} data-active="true">Loading animation...</p>}
              {narration.map((caption, index) => (
                <p key={caption.shot} className={styles.caption} data-active={!loading && index === shot}>
                  <span className={styles.step}>
                    {String(index + 1).padStart(2, "0")} / {String(narration.length).padStart(2, "0")}
                  </span>
                  <strong className={styles.captionTitle}>{caption.title}</strong> {caption.text}
                </p>
              ))}
            </div>
            <p role="status" className="sr-only">{loading ? "Loading animation." : ""}</p>
            <div aria-hidden="true" className={styles.progress}>
              <span className={styles.progressFill} />
              {SHOTS.slice(1).map((entry) => (
                <span key={entry.key} className={styles.tick} style={{ left: `${(entry.start / DURATION) * 100}%` }} />
              ))}
            </div>
          </div>
          {children && mode === "static" && <FilmSteps className={styles.compactSteps} />}
        </div>
      </div>

      {/* The same story in words: on the page when the film is not playing by
          itself, and for screen readers when it is. */}
      {(mode === "poster" || mode === "film") && (!still || children) && <FilmSteps className="sr-only" />}
      {!children && hydrated && (mode === "static" || still) && <FilmSteps className={styles.steps} />}
      <noscript>
        <FilmSteps className={children ? styles.compactSteps : styles.steps} />
      </noscript>
    </section>
  );
}
