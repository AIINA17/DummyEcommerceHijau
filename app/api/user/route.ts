import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";
import type { User } from "@/lib/types";

const SELECT = `id, username, email, phone, address, avatar_url, balance, created_at`;

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await sql.query(
    `SELECT ${SELECT} FROM users WHERE id = $1`,
    [userId]
  )) as User[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: rows[0] });
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username, email, phone, address } = body ?? {};

  if (username !== undefined && String(username).trim().length < 3) {
    return NextResponse.json(
      { error: "Username minimal 3 karakter" },
      { status: 400 }
    );
  }

  try {
    // COALESCE: field yang tidak dikirim dibiarkan apa adanya.
    const rows = (await sql.query(
      `UPDATE users
          SET username = COALESCE($2, username),
              email    = COALESCE($3, email),
              phone    = COALESCE($4, phone),
              address  = COALESCE($5, address)
        WHERE id = $1
      RETURNING ${SELECT}`,
      [
        userId,
        username === undefined ? null : String(username).trim(),
        email === undefined ? null : email,
        phone === undefined ? null : phone,
        address === undefined ? null : address,
      ]
    )) as User[];

    return NextResponse.json({
      success: true,
      data: rows[0],
      message: "Profil berhasil diperbarui",
    });
  } catch (error) {
    const message = String((error as Error).message);
    if (message.includes("users_username_key")) {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 409 }
      );
    }
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
