"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS = [
  { value: "sold_desc", label: "Paling Sesuai" },
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "rating_desc", label: "Rating Tertinggi" },
];

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "sold_desc";

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[13px] text-ink-muted sm:inline">Urutkan:</span>
      <Select
        value={current}
        onValueChange={(value) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", String(value));
          router.push(`/search?${next.toString()}`);
        }}
      >
        <SelectTrigger className="h-9 w-44" aria-label="Urutkan hasil">
          {/* Base UI menampilkan nilai mentahnya kalau tidak dipetakan —
              tanpa ini yang muncul di trigger adalah "sold_desc". */}
          <SelectValue>
            {(value) =>
              OPTIONS.find((o) => o.value === value)?.label ?? OPTIONS[0].label
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
