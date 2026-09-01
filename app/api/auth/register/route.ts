import bcrypt from "bcryptjs";

import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json(
        { success: false, message: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }
    if (String(username).trim().length < 3) {
      return Response.json(
        { success: false, message: "Username minimal 3 karakter" },
        { status: 400 }
      );
    }
    if (String(password).length < 6) {
      return Response.json(
        { success: false, message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(String(password), 10);

    // Saldo awal 1 juta supaya user baru bisa langsung coba bayar pakai wallet.
    const rows = (await sql`
      INSERT INTO users (username, password, balance)
      VALUES (${String(username).trim()}, ${hashed}, 1000000)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `) as { id: number }[];

    if (rows.length === 0) {
      return Response.json(
        { success: false, message: "Username sudah digunakan" },
        { status: 409 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
