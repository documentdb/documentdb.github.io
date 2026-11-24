"use client";

import { useEffect, useRef, useState } from "react";
import { agentKitUrl, galleryRevision, samplePrompts, SAMPLES_GALLERY_URL } from "./promptContent";
import styles from "./AgentPrompts.module.css";
import { withBasePath } from "../../services/sitePath";

type Link = { label: string; href: string };
const slides = [{ id: "starter", label: "Starter" }, ...samplePrompts];

export default function AgentPrompts({ primary, secondary }: { primary: Link; secondary: Link }) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [feedback, setFeedback] = useState<{ id: string; error: boolean } | null>(null);
  const [rotating, setRotating] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const slide = slides[selected];
  const prompt = selected === 0 ? null : samplePrompts[selected - 1];
  const currentFeedback = prompt && feedback?.id === prompt.id ? feedback : null;
  const rotationActive = rotating && !hovered && !focused && visible && expanded;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => { if (motion.matches) setRotating(false); };
    const updateVisibility = () => setVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!rotationActive) return;
    const timer = window.setTimeout(() => {
      setSelected((index) => (index + 1) % slides.length);
      setFeedback(null);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [rotationActive, selected]);

  function selectSlide(index: number) {
    setSelected((index + slides.length) % slides.length);
    setFeedback(null);
  }

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.prompt);
    } catch {
      setFeedback({ id: prompt.id, error: true });
      return;
    }
    setFeedback({ id: prompt.id, error: false });
  }

  return (
    <div className={styles.panel} role="region" aria-roledescription="carousel"
      aria-label="DocumentDB starter and sample applications"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Open source. Agent ready. Yours to run.</p>
        <h1 id="hero-heading">One prompt. A working app.</h1>
        <p className={styles.description}>Start with the basics, or let your agent build a sample.</p>
      </div>

      <div hidden={!expanded} className={styles.carouselNav}>
        <button type="button" aria-label="Previous slide" aria-controls="sample-panel"
          className={styles.arrow} onClick={() => selectSlide(selected - 1)}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m10 4-4 4 4 4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <div role="tablist" aria-label="Sample applications" className={styles.tabs}>
        {slides.map((sample, index) => (
          <button key={sample.id} ref={(element) => { buttons.current[index] = element; }}
            type="button" role="tab" id={`tab-${sample.id}`} aria-controls="sample-panel"
            aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
            onClick={() => selectSlide(index)}
            onKeyDown={(event) => {
              const next = event.key === "ArrowRight" ? (index + 1) % slides.length
                : event.key === "ArrowLeft" ? (index + slides.length - 1) % slides.length
                  : event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : null;
              if (next === null) return;
              event.preventDefault();
              selectSlide(next);
              buttons.current[next]?.focus();
            }}>
            {sample.label}
          </button>
        ))}
        </div>
        <button type="button" aria-label="Next slide" aria-controls="sample-panel"
          className={styles.arrow} onClick={() => selectSlide(selected + 1)}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div role="tabpanel" id="sample-panel" aria-labelledby={`tab-${slide.id}`}
        aria-roledescription="slide" data-carousel-slide={slide.id} className={styles.sample}>
        <div className={styles.toolbar}>
          <button type="button" onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded} aria-controls="prompt-content" className={styles.fold}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d={expanded ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {expanded ? "Under the Hood" : prompt ? "Show prompt" : "Show starter"}
          </button>
          <div className={styles.actions}>
          {expanded && <button type="button" className={styles.rotation}
            aria-label={rotating ? "Pause carousel rotation" : "Resume carousel rotation"}
            onClick={() => setRotating(!rotating)}>
            <svg viewBox="0 0 12 12" aria-hidden="true">
              {rotating ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M2.5 1 11 6l-8.5 5z" />}
            </svg>
          </button>}
          {prompt && <button type="button" onClick={copyPrompt} aria-label={`Copy ${prompt.label} prompt`}
            data-agent-prompt={prompt.folder} className={styles.copy}>
            {currentFeedback && !currentFeedback.error ? "Copied" : "Copy prompt"}
          </button>}
          </div>
        </div>
        <div className={styles.intro}>
          {prompt ? <>
            <h2>{prompt.title}</h2>
            <p>{prompt.description}</p>
          </> : <>
            <h2><a href={withBasePath("/why-document-databases/")} target="_blank" rel="noopener noreferrer">
              Why are there so many document databases?
            </a></h2>
            <p>A familiar document model. More choice in how you run it.</p>
          </>}
        </div>
        <div id="prompt-content" hidden={!expanded} className={prompt ? styles.prompt : styles.summary}>
          {prompt ? <textarea id="sample-prompt" readOnly value={prompt.prompt} aria-label="End-to-end sample prompt"
            spellCheck={false} rows={5} /> : <div tabIndex={0} role="region" aria-label="Document database overview">
            <p>Document databases keep profiles, product catalogs, and AI records close to the application&apos;s data model.
              Nested fields and evolving attributes do not require a table for every shape. But the document model does not
              dictate one engine, API, license, or cloud.</p>
            <p>Open-source DocumentDB combines BSON documents and selected compatible driver operations with PostgreSQL&apos;s
              mature database foundation and an MIT license. Start locally, test real queries and compatibility, then choose
              self-hosting or managed operations. Choose documents for the application and hosting for the organization.</p>
            <a href={withBasePath("/why-document-databases/")} target="_blank" rel="noopener noreferrer">
              Read the full article &rarr;
            </a>
          </div>}
        </div>
        <nav aria-label="Explore DocumentDB" hidden={expanded} className={styles.links}>
          <a href={withBasePath("/why-document-databases/")} target="_blank" rel="noopener noreferrer">
            Why are there so many document databases?<span aria-hidden="true">&rarr;</span>
          </a>
          <a href={primary.href} data-campaign-link="primary" target="_blank" rel="noopener noreferrer">
            {primary.label}<span aria-hidden="true">&rarr;</span>
          </a>
          <a href={secondary.href} data-campaign-link="secondary" target="_blank" rel="noopener noreferrer">
            {secondary.label}<span aria-hidden="true">&rarr;</span>
          </a>
          <a href={agentKitUrl} target="_blank" rel="noopener noreferrer">
            Agent-Kit<span aria-hidden="true">&rarr;</span>
          </a>
        </nav>
        <p role="status" aria-live={rotationActive ? "off" : "polite"}
          className={`${styles.status} ${currentFeedback?.error ? styles.error : ""}`}>
          {currentFeedback?.error
            ? expanded ? "Could not copy. Select the prompt text and copy it manually." : "Could not copy. Show the prompt and copy it manually."
            : currentFeedback ? "Copied. Paste into your coding agent, not a shell."
              : prompt?.expected ?? "Document model · PostgreSQL foundation · MIT licensed"}
        </p>
      </div>

      <nav aria-label={prompt ? "Sample resources" : "Starter resources"} className={styles.resources}>
        {prompt ? <>
        <span>{prompt.stack}</span>
        <div>
          <a href={`${SAMPLES_GALLERY_URL}/tree/${galleryRevision}/${prompt.folder}`} target="_blank" rel="noopener noreferrer">Sample source</a>
          <a href={agentKitUrl} target="_blank" rel="noopener noreferrer">Agent-Kit <span className={styles.preview}>preview</span></a>
        </div>
        </> : <a href={withBasePath("/docs/getting-started/")} target="_blank" rel="noopener noreferrer">
          Getting-started tutorial &rarr;
        </a>}
      </nav>
    </div>
  );
}
