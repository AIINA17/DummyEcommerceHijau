import { sql } from "@/lib/db";

// Katalog dummy tidak punya foto produk asli. Daripada menampilkan gambar rusak
// atau menarik gambar dari domain luar, tiap produk dapat thumbnail SVG yang
// dibangkitkan dari namanya: warna konsisten per kategori, inisial di tengah.

const PALETTE: Record<string, [string, string, string]> = {
  "Gadget & Tech": ["#e8f1ff", "#c9ddfb", "#2f6fd0"],
  Lifestyle: ["#fff0f4", "#ffd6e2", "#d8447a"],
  "Home & Living": ["#eef8f1", "#cdebd8", "#268a56"],
  "Lain-lain": ["#fff6e8", "#ffe4bd", "#c47a1a"],
};

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const productId = Number(id);

  let name = "Produk";
  let category = "Lain-lain";

  if (Number.isInteger(productId) && productId > 0) {
    const rows = (await sql`
      SELECT name, category FROM products WHERE id = ${productId}
    `) as { name: string; category: string }[];
    if (rows[0]) {
      name = rows[0].name;
      category = rows[0].category;
    }
  }

  const [bg, shade, ink] = PALETTE[category] ?? PALETTE["Lain-lain"];
  const label = initials(name);
  const angle = (productId * 47) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${shade}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <g transform="rotate(${angle} 200 200)" opacity="0.35">
    <circle cx="200" cy="200" r="150" fill="none" stroke="${ink}" stroke-width="1.5"/>
    <rect x="118" y="118" width="164" height="164" rx="24" fill="none" stroke="${ink}" stroke-width="1.5"/>
  </g>
  <text x="200" y="200" text-anchor="middle" dominant-baseline="central"
        font-family="Open Sauce One, -apple-system, sans-serif"
        font-size="112" font-weight="800" fill="${ink}" opacity="0.9">${escapeXml(label)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
