import { NextRequest, NextResponse } from "next/server";

import { getProducts } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    function num(key: string): number | undefined {
      const raw = sp.get(key);
      if (raw === null || raw === "") return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    }

    // Filter, sort, dan whitelist-nya dipakai bareng Server Component supaya
    // hasil dari /api/products dan dari halaman /search tidak pernah beda.
    const data = await getProducts({
      q: sp.get("q") ?? "",
      category: sp.get("category") ?? "",
      min: num("min"),
      max: num("max"),
      rating: num("rating"),
      sort: sp.get("sort") ?? "",
      limit: num("limit"),
      offset: num("offset"),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
