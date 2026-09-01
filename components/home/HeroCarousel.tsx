"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const SLIDES = [
  {
    eyebrow: "Super Brand Day",
    title: "Gadget Impian, Harga Kaget",
    subtitle: "Diskon s.d. 40% + Cashback",
    href: "/search?category=Gadget+%26+Tech",
    from: "#04331f",
    to: "#00aa5b",
  },
  {
    eyebrow: "Waktu Indonesia Belanja",
    title: "Rumah Rapi, Hati Senang",
    subtitle: "Perabot pilihan mulai Rp99rb",
    href: "/search?category=Home+%26+Living",
    from: "#1d2b4a",
    to: "#3f7bd4",
  },
  {
    eyebrow: "Gaya Kamu",
    title: "Restock Lemari Bulan Ini",
    subtitle: "Fashion & beauty, gratis ongkir",
    href: "/search?category=Lifestyle",
    from: "#4a1d33",
    to: "#d8447a",
  },
];

const INTERVAL = 5500;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    // Hormati prefers-reduced-motion: kalau user minta gerakan minimal,
    // carousel berhenti auto-play dan hanya berpindah saat diklik.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label="Promo pilihan"
      className="group relative overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-[280ms] ease-[var(--ease-toped)]"
        style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
      >
        {SLIDES.map((slide, i) => (
          <Link
            key={slide.title}
            href={slide.href}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            aria-label={`${slide.eyebrow}: ${slide.title}`}
            className="relative flex aspect-[1200/380] w-full shrink-0 flex-col justify-center px-8 sm:px-14"
            style={{
              backgroundImage: `linear-gradient(105deg, ${slide.from} 0%, ${slide.to} 100%)`,
            }}
          >
            <p className="text-[12px] font-bold tracking-[0.18em] text-white/70 uppercase">
              {slide.eyebrow}
            </p>
            <h2 className="mt-2 max-w-lg text-[26px] leading-[1.15] font-extrabold text-white sm:text-[38px]">
              {slide.title}
            </h2>
            <p className="mt-2 text-[14px] font-bold text-white/85 sm:text-[18px]">
              {slide.subtitle}
            </p>
            <span className="mt-5 w-fit rounded-lg bg-white px-4 py-2 text-[13px] font-extrabold text-ink">
              Lihat Promo
            </span>
          </Link>
        ))}
      </div>

      {/* Panah muncul saat hover — di Tokopedia juga tersembunyi sampai diarahkan. */}
      {[
        { dir: -1, Icon: ChevronLeft, side: "left-3", label: "Promo sebelumnya" },
        { dir: 1, Icon: ChevronRight, side: "right-3", label: "Promo berikutnya" },
      ].map(({ dir, Icon, side, label }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          onClick={() => go(index + dir)}
          className={cn(
            "absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-[var(--shadow-card)]",
            "opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100",
            "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
            side
          )}
        >
          <Icon aria-hidden className="size-5" />
        </button>
      ))}

      <div className="absolute bottom-3 left-8 flex gap-1.5 sm:left-14">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Ke promo ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={cn(
              "h-1.5 rounded-full bg-white transition-[width,opacity] duration-200",
              i === index ? "w-5 opacity-100" : "w-1.5 opacity-50 hover:opacity-80"
            )}
          />
        ))}
      </div>
    </section>
  );
}
