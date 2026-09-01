import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { sql } from "@/lib/db";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const rows = (await sql`
      SELECT id, username, password FROM users WHERE username = ${username}
    `) as { id: number; username: string; password: string }[];

    const user = rows[0];
    // Pesan yang sama untuk user tidak ada maupun password salah, supaya tidak
    // bisa dipakai menebak username mana yang terdaftar.
    const invalid = NextResponse.json(
      { success: false, error: "Username atau password salah" },
      { status: 401 }
    );

    if (!user) return invalid;
    if (!(await bcrypt.compare(String(password), user.password))) return invalid;

    return NextResponse.json({
      success: true,
      token: signToken({ userId: user.id, username: user.username }),
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Token auth error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
