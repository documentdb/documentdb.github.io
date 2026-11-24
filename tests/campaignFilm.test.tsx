import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import CampaignFilm from '../app/components/campaign/CampaignFilm';
import { narration } from '../app/components/campaign/filmContent';
import { CUE, DURATION, SHOTS, STILL_AT, finaleAt, shotIndexAt } from '../app/components/campaign/scene/film';
import { Rig } from '../app/components/campaign/scene/rig';
import { Signal } from '../app/components/campaign/scene/signal';

const campaignDir = path.join(import.meta.dirname, '../app/components/campaign');
const read = (file: string) => fs.readFileSync(path.join(campaignDir, file), 'utf8');
// The way React's server renderer escapes text.
const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;');

// A page chooses only the copy and the links beside the film.
function render(copy = { tagline: 'Tagline', heading: 'Heading', description: 'Description', primary: 'Primary', secondary: 'Secondary' }) {
  return renderToStaticMarkup(createElement(CampaignFilm, {
    tagline: copy.tagline,
    heading: copy.heading,
    description: copy.description,
    primary: { label: copy.primary, href: '/docs/getting-started/' },
    secondary: { label: copy.secondary, href: '/packages/' },
  }));
}

/** The film's own markup: its control, its narration and its written fallback. */
const filmPart = (html: string) => html.slice(html.indexOf('<button'), html.indexOf('</noscript>'));

describe('campaign film timeline', () => {
  it('runs eight shots back to back over one loop', () => {
    expect(SHOTS).toHaveLength(8);
    expect(SHOTS[0].start).toBe(0);
    expect(SHOTS.at(-1)?.end).toBe(DURATION);
    for (let i = 1; i < SHOTS.length; i++) {
      expect(SHOTS[i].start).toBe(SHOTS[i - 1].end);
      expect(SHOTS[i].end).toBeGreaterThan(SHOTS[i].start);
    }
  });

  it('finds the shot for any moment, including after a loop', () => {
    SHOTS.forEach((shot, index) => {
      expect(shotIndexAt(shot.start)).toBe(index);
      expect(shotIndexAt((shot.start + shot.end) / 2)).toBe(index);
    });
    expect(shotIndexAt(DURATION + 1)).toBe(0);
    expect(shotIndexAt(-0.5)).toBe(SHOTS.length - 1);
  });

  it('keeps every cue in story order', () => {
    const times = Object.values(CUE);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times[0]).toBeGreaterThan(0);
    expect(times.at(-1)).toBeLessThan(DURATION);
  });

  it('puts each beat of the story in the shot that narrates it', () => {
    const shotOf = (time: number) => SHOTS[shotIndexAt(time)].key;
    expect(shotOf(CUE.tap)).toBe('tap');
    expect(shotOf(CUE.fieldStock)).toBe('doc');
    expect(shotOf(CUE.mouth)).toBe('wire');
    expect(shotOf(CUE.cross)).toBe('gateway');
    expect(shotOf(CUE.leaf)).toBe('btree');
    expect(shotOf(CUE.stamp)).toBe('mvcc');
    expect(shotOf(CUE.vacuum)).toBe('mvcc');
    expect(shotOf(CUE.tagQuery)).toBe('indexes');
    expect(shotOf(CUE.nearQuery)).toBe('indexes');
    expect(shotOf(CUE.replyPhone)).toBe('stack');
  });

  it('shows the whole stack only near the end, and uses it as the still frame', () => {
    expect(finaleAt(CUE.tap)).toBe(0);
    expect(finaleAt(CUE.write)).toBe(0);
    expect(finaleAt(STILL_AT)).toBe(1);
    expect(finaleAt(DURATION)).toBe(0);
    expect(SHOTS[shotIndexAt(STILL_AT)].key).toBe('stack');
  });
});

describe('campaign film narration', () => {
  it('has one short line per shot, in order', () => {
    expect(narration.map((caption) => caption.shot)).toEqual(SHOTS.map((shot) => shot.key));
    for (const caption of narration) {
      expect(caption.title.length, caption.title).toBeLessThanOrEqual(36);
      expect(caption.text.length, caption.title).toBeLessThanOrEqual(100);
      expect(caption.facts.length, caption.title).toBeGreaterThan(0);
      expect(caption.facts.length, caption.title).toBeLessThanOrEqual(3);
    }
  });

  // The film is not part of the experiment: whatever copy a page puts beside
  // it, the film and its words stay exactly the same.
  it('belongs to the film, not to the page that shows it', () => {
    // Marker words that the narration itself never uses.
    const one = render({ tagline: 'Quokka tagline', heading: 'Quokka heading', description: 'Quokka description', primary: 'Quokka', secondary: 'Quoll' });
    const other = render({ tagline: 'Wombat tagline', heading: 'Wombat heading', description: 'Wombat description', primary: 'Wombat', secondary: 'Numbat' });
    expect(one).not.toBe(other);
    expect(filmPart(one).length).toBeGreaterThan(0);
    expect(filmPart(other)).toBe(filmPart(one));
    for (const word of ['Quokka', 'Quoll', 'Wombat', 'Numbat']) expect(filmPart(one)).not.toContain(word);
  });

  it('never names another database product', () => {
    const words = narration.flatMap((caption) => [caption.title, caption.text, ...caption.facts]).join(' ');
    expect(words).not.toMatch(/mongo/i);
    for (const file of ['scene/shell.ts', 'scene/stations/gatewayStation.ts', 'scene/mockups.ts']) {
      expect(read(file), file).not.toMatch(/mongo/i);
    }
  });

  it('uses the invented shop and shoe names, never the retired ones', () => {
    const sources = [
      'filmContent.ts',
      'scene/mockups.ts',
      'scene/stations/docStation.ts',
      'scene/stations/heapStation.ts',
      'scene/stations/phoneStation.ts',
      'scene/stations/vectorStation.ts',
    ].map(read).join('\n');
    expect(sources).toContain('TrailyShop');
    expect(sources).toContain('Traily Run');
    expect(sources).not.toMatch(/Trail Runner/i);
    expect(sources).not.toMatch(/trailshop/i);
  });
});

describe('campaign film light', () => {
  const signal = new Signal();
  const at = (t: number) => signal.position(t, new Vector3());

  it('is only present on the way down and on the way back', () => {
    expect(signal.presence(CUE.tap)).toBe(0);
    expect(signal.presence((CUE.phoneEdge + CUE.mouth) / 2)).toBe(1);
    expect(signal.presence(CUE.leaf)).toBe(1);
    expect(signal.presence(CUE.vacuum)).toBe(0);
    expect(signal.presence(CUE.tagQuery)).toBe(0);
    expect(signal.presence((CUE.reply + CUE.replyGateway) / 2)).toBe(1);
    expect(signal.presence(DURATION - 0.5)).toBe(0);
  });

  it.each([
    ['update', CUE.depart, CUE.tuple],
    ['reply', CUE.reply, CUE.replyPhone],
  ])('travels without jumps: %s', (_name, from, to) => {
    const step = 1 / 120;
    let previous = at(from);
    for (let t = from + step; t <= to; t += step) {
      const current = at(t);
      expect(current.distanceTo(previous), `t=${t.toFixed(2)}`).toBeLessThan(1);
      previous = current;
    }
  });

  it('goes down through the gateway and comes back to where it left', () => {
    expect(at(CUE.tuple).y).toBeLessThan(at(CUE.cross).y);
    expect(at(CUE.cross).y).toBeLessThan(at(CUE.roof).y);
    expect(at(CUE.replyPhone).distanceTo(at(CUE.phoneEdge))).toBeLessThan(1e-6);
    expect(at(CUE.replyRoof).distanceTo(at(CUE.roof + 0.12))).toBeLessThan(1e-6);
  });

  it('changes sides exactly at the gateway, in both directions', () => {
    expect(signal.side(CUE.aboveRing)).toBe(0);
    expect(signal.side(CUE.belowRing)).toBe(1);
    expect(signal.side(CUE.reply)).toBe(1);
    expect(signal.side(CUE.replyRoof)).toBe(0);
  });
});

describe('campaign film camera', () => {
  const sizes: [number, number][] = [[390, 743], [1024, 700], [1440, 799], [1920, 1000]];

  it.each(sizes)('moves in one unbroken shot at %ix%i', (width, height) => {
    const rig = new Rig(new Signal());
    rig.resize(width, height);
    const step = 1 / 60;
    const previous = new Vector3();
    for (let t = 0; t <= DURATION; t += step) {
      rig.update(t, 0, 0, finaleAt(t), true);
      const { position } = rig.camera;
      expect(Number.isFinite(position.x + position.y + position.z), `t=${t.toFixed(2)}`).toBe(true);
      if (t > 0) expect(position.distanceTo(previous), `t=${t.toFixed(2)}`).toBeLessThan(4);
      previous.copy(position);
    }
  });

  it('ends where it began, so the film can loop', () => {
    const rig = new Rig(new Signal());
    rig.resize(1440, 799);
    rig.update(0, 0, 0, 0, true);
    const start = rig.camera.position.clone();
    const facing = rig.camera.getWorldDirection(new Vector3());
    rig.update(DURATION, 0, 0, 0, true);
    expect(rig.camera.position.distanceTo(start)).toBeLessThan(1e-6);
    expect(rig.camera.getWorldDirection(new Vector3()).distanceTo(facing)).toBeLessThan(1e-6);
  });

  it('lingers on a shot and hurries between shots', () => {
    const rig = new Rig(new Signal());
    rig.resize(1440, 799);
    const speedAt = (t: number) => {
      rig.update(t, 0, 0, finaleAt(t), true);
      const from = rig.camera.position.clone();
      rig.update(t + 0.05, 0, 0, finaleAt(t + 0.05), true);
      return rig.camera.position.distanceTo(from) / 0.05;
    };
    // Resting on the document, the gateway, the heap page.
    for (const t of [5, 11, 19.5]) expect(speedAt(t), `t=${t}`).toBeLessThan(1);
    // Following the light down to the hall, and pulling back to the overview.
    for (const t of [8.3, 29.4]) expect(speedAt(t), `t=${t}`).toBeGreaterThan(4);
  });

  it('starts at the phone and is deepest at the heap page', () => {
    const rig = new Rig(new Signal());
    rig.resize(1440, 799);
    const heightAt = (t: number) => {
      rig.update(t, 0, 0, finaleAt(t), true);
      return rig.camera.position.y;
    };
    const phone = heightAt(0);
    expect(heightAt(CUE.cross)).toBeLessThan(phone);
    expect(heightAt(CUE.leaf)).toBeLessThan(heightAt(CUE.cross));
    expect(heightAt(CUE.stamp)).toBeLessThan(heightAt(CUE.leaf));
    expect(heightAt(CUE.tagQuery + 1)).toBeGreaterThan(heightAt(CUE.stamp));
    expect(heightAt(CUE.nearQuery)).toBeGreaterThan(heightAt(CUE.tagQuery + 1));
  });
});

describe('campaign film markup', () => {
  it('server-renders an ordinary hero that needs no script', () => {
    const html = render();
    expect(html).toContain('data-mode="poster"');
    expect(html).toContain('src="/images/campaign-film-poster.webp"');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.match(/data-campaign-link="/g)).toHaveLength(2);
    // The canvas is created by the scene at run time, never by the server.
    expect(html).not.toContain('<canvas');
  });

  it('starts paused and offers exactly one control to play the film', () => {
    const html = render();
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Play the animation"');
    expect(html).toContain('data-playing="false"');
    expect(html.match(/<button[^>]*>/)?.[0]).not.toContain('disabled');
    // No step-by-step navigation: the film plays by itself.
    expect(html).not.toContain('<nav');
    expect(html).not.toContain('aria-current');
  });

  it('matches the initial caption and progress to the stack poster', () => {
    const html = render();
    expect(html).toContain(`data-shot="${SHOTS[shotIndexAt(STILL_AT)].key}"`);
    expect(html).toContain(`--film-progress:${STILL_AT / DURATION}`);
    expect(html).toContain(`data-active="true"><span`);
    expect(html).toContain(`fetchPriority="low"`);
  });

  it('keeps the whole story readable without WebGL or JavaScript', () => {
    const html = render();
    const fallback = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'));
    expect(fallback.length).toBeGreaterThan(0);
    for (const caption of narration) {
      expect(fallback).toContain(escapeHtml(caption.title));
      expect(fallback).toContain(escapeHtml(caption.text));
      for (const fact of caption.facts) expect(fallback).toContain(escapeHtml(fact));
    }
  });

  it('hides the moving narration from screen readers', () => {
    const html = render();
    const player = html.slice(html.indexOf('<button'), html.indexOf('<noscript>'));
    expect(player).toContain(escapeHtml(narration[0].title));
    expect(player.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe('campaign film loading', () => {
  const component = read('CampaignFilm.tsx');

  it('loads three.js on demand instead of bundling it with the page', () => {
    expect(component).toContain('await import("./scene")');
    // The timeline is the one scene file the page may import directly, and it
    // must not pull the renderer in behind it.
    const staticSceneImports = (component.match(/^import (?!type\b).*from "\.\/scene(\/[^"]*)?";$/gm) ?? [])
      .filter((line) => !line.endsWith('from "./scene/film";'));
    expect(staticSceneImports).toEqual([]);
    for (const file of ['scene/film.ts', 'scene/util.ts', 'filmContent.ts']) {
      expect(read(file), file).not.toMatch(/from "three/);
    }
    expect(read('scene/film.ts').match(/^import .*$/gm)).toEqual(['import { envelope } from "./util";']);
  });

  it('keeps Next.js route file names out of the component folders under app/', () => {
    // A file named layout.ts or page.ts anywhere under app/ becomes a route.
    const reserved = /^(page|layout|route|template|loading|error|not-found|default|global-error)\.(ts|tsx|js|jsx)$/;
    const root = path.join(import.meta.dirname, '../app/components');
    const offenders = (fs.readdirSync(root, { recursive: true }) as string[])
      .filter((file) => reserved.test(path.basename(file)));
    expect(offenders).toEqual([]);
  });
});
