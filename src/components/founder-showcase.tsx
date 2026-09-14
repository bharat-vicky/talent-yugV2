"use client";

import Image from "next/image";
import {
  Asterisk,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import styles from "./founder-showcase.module.css";

const ROTATION_MS = 5_000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Portrait positions reference the unchanged team photograph on slide 12.
const founders = [
  {
    name: "Gautam Kumar",
    role: "Managing Director, TalentYug",
    position: "-208.293%",
    shortName: "Gautam",
  },
  {
    name: "Hridayanand Gupta",
    role: "Director & CTO, TalentYug",
    position: "-377.073%",
    shortName: "Hridayanand",
  },
  {
    name: "Ritu Raj",
    role: "Director & CEO, TalentYug",
    position: "-538.537%",
    shortName: "Ritu",
  },
] as const;

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function Portrait({
  index,
  thumbnail = false,
}: {
  index: number;
  thumbnail?: boolean;
}) {
  const founder = founders[index];
  return (
    <span
      className={`${styles.portrait} ${thumbnail ? styles.thumbnail : ""}`}
      style={{ "--portrait-left": founder.position } as CSSProperties}
    >
      <Image
        src="/images/founding-team.webp"
        alt={thumbnail ? "" : founder.name}
        width={3840}
        height={2160}
        sizes="(max-width: 760px) 640px, 750px"
        draggable={false}
      />
    </span>
  );
}

export function FounderShowcase() {
  const [active, setActive] = useState(0);
  const [playback, setPlayback] = useState<"auto" | "playing" | "paused">(
    "auto",
  );
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
  const pageVisible = useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === "visible",
    () => false,
  );
  const playbackEnabled =
    playback === "playing" || (playback === "auto" && !reducedMotion);
  const rotating = playbackEnabled && !hovered && inView && pageVisible;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % founders.length),
      ROTATION_MS,
    );
    return () => window.clearInterval(timer);
  }, [rotating]);

  function select(index: number) {
    setActive((index + founders.length) % founders.length);
    setPlayback("paused");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    select(active + (event.key === "ArrowRight" ? 1 : -1));
  }

  return (
    <section
      ref={cardRef}
      className={styles.card}
      aria-label="TalentYug founders"
      aria-roledescription="carousel"
      data-reveal
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        const entering = !event.currentTarget.contains(
          event.relatedTarget as Node | null,
        );
        const rotationControl = (event.target as HTMLElement).closest(
          "[data-rotation-toggle]",
        );
        if (entering && !rotationControl) setPlayback("paused");
      }}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.heading}>
        <span className="eyebrow">THE PEOPLE BEHIND THE PURPOSE</span>
        <Asterisk size={35} strokeWidth={1.3} aria-hidden="true" />
      </div>

      <div
        className={styles.stage}
        aria-live={rotating ? "off" : "polite"}
        aria-atomic="true"
      >
        {founders.map((founder, index) => (
          <div
            key={founder.name}
            className={`${styles.slide} ${active === index ? styles.active : ""}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${founders.length}`}
            aria-hidden={active !== index}
            inert={active !== index}
          >
            <div className={styles.portraitFrame}>
              <Portrait index={index} />
              <span className={styles.portraitNumber} aria-hidden="true">
                0{index + 1}
              </span>
            </div>
            <div className={styles.profile}>
              <span className={styles.profileEyebrow}>MEET OUR FOUNDERS</span>
              <h3>{founder.name}</h3>
              <span className={styles.role}>{founder.role}</span>
              <span className={styles.location}>
                <MapPin size={13} aria-hidden="true" /> Bihar, India
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.purpose}>
        Three founders. One belief.
        <br />
        <em>Opportunity should reach every student.</em>
      </p>

      <div className={styles.navigation}>
        <div
          className={styles.people}
          role="group"
          aria-label="Choose a founder"
        >
          {founders.map((founder, index) => (
            <button
              key={founder.name}
              type="button"
              className={`${styles.personButton} ${active === index ? styles.selected : ""}`}
              onClick={() => select(index)}
              aria-label={`Show ${founder.name}`}
              aria-pressed={active === index}
              title={founder.name}
            >
              <Portrait index={index} thumbnail />
              <span className={styles.personName}>{founder.shortName}</span>
            </button>
          ))}
        </div>
        <div className={styles.controls}>
          {
            <button
              type="button"
              className={styles.controlButton}
              data-rotation-toggle
              onClick={() =>
                setPlayback(playbackEnabled ? "paused" : "playing")
              }
              aria-label={
                playbackEnabled
                  ? "Pause profile rotation"
                  : "Start profile rotation"
              }
              title={playbackEnabled ? "Pause rotation" : "Start rotation"}
            >
              {playbackEnabled ? <Pause size={15} /> : <Play size={15} />}
            </button>
          }
          <button
            type="button"
            className={styles.controlButton}
            aria-label="Previous founder"
            onClick={() => select(active - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className={styles.controlButton}
            aria-label="Next founder"
            onClick={() => select(active + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={styles.footer}>
        <span>
          <ShieldCheck size={16} aria-hidden="true" /> TalentYug Pvt. Ltd.
        </span>
        <span className={styles.counter} aria-hidden="true">
          0{active + 1}
          <span> / 03</span>
        </span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <span
          key={`${active}-${rotating}`}
          className={rotating ? styles.progressRunning : ""}
          style={{ animationDuration: `${ROTATION_MS}ms` }}
        />
      </div>
    </section>
  );
}
