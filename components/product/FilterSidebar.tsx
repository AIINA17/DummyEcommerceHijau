"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const RATINGS = [4.5, 4.0, 3.0];

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-b-0">
      <h3 className="mb-3 text-[14px] font-extrabold">{title}</h3>
      {children}
    </section>
  );
}

export function FilterSidebar() {
  const router = useRouter();
  const params = useSearchParams();

  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  const activeCategory = params.get("category") ?? "";
  const activeRating = params.get("rating") ?? "";

  /** Ubah satu parameter, sisanya dipertahankan. Nilai kosong = hapus filter. */
  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/search?${next.toString()}`);
  }

  const hasFilter = Boolean(activeCategory || activeRating || min || max);

  return (
    <aside
      aria-label="Filter produk"
      className="h-fit overflow-hidden rounded-xl bg-white shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-[16px]">Filter</h2>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setMin("");
              setMax("");
              const next = new URLSearchParams();
              const q = params.get("q");
              if (q) next.set("q", q);
              router.push(`/search${next.size ? `?${next}` : ""}`);
            }}
            className="text-[12px] font-bold text-brand transition-colors duration-200 hover:text-brand-hover"
          >
            Reset
          </button>
        )}
      </div>

      <Group title="Kategori">
        <ul className="space-y-2.5">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <Checkbox
                  checked={activeCategory === c}
                  onCheckedChange={(checked) =>
                    apply({ category: checked ? c : "" })
                  }
                />
                <span className={cn(activeCategory === c && "font-bold text-brand")}>
                  {c}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Harga">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ min, max });
          }}
        >
          {[
            { id: "min", label: "Harga Minimum", value: min, set: setMin },
            { id: "max", label: "Harga Maksimum", value: max, set: setMax },
          ].map((field) => (
            <div
              key={field.id}
              className="flex h-9 items-center overflow-hidden rounded-lg border border-line focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
            >
              <span className="grid h-full w-9 shrink-0 place-items-center border-r border-line bg-ground text-[12px] font-bold text-ink-muted">
                Rp
              </span>
              <input
                inputMode="numeric"
                aria-label={field.label}
                placeholder={field.label}
                value={field.value}
                onChange={(e) => field.set(e.target.value.replace(/\D/g, ""))}
                className="h-full w-full min-w-0 px-2.5 text-[13px] outline-none"
              />
            </div>
          ))}
          <Button type="submit" size="sm" variant="outline" className="w-full">
            Terapkan
          </Button>
        </form>
      </Group>

      <Group title="Rating">
        <ul className="space-y-1">
          {RATINGS.map((r) => {
            const active = activeRating === String(r);
            return (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => apply({ rating: active ? "" : String(r) })}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-200",
                    active ? "bg-brand-soft font-bold text-brand" : "hover:bg-ground"
                  )}
                >
                  <Star aria-hidden className="size-4 fill-star text-star" strokeWidth={0} />
                  {r.toFixed(1)} ke atas
                </button>
              </li>
            );
          })}
        </ul>
      </Group>
    </aside>
  );
}
