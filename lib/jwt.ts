import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;

export interface JWTPayload {
  userId: number;
  username: string;
}

export function signToken(payload: JWTPayload): string {
  if (!JWT_SECRET) throw new Error("NEXTAUTH_SECRET belum diset");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(req: NextRequest): JWTPayload | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    if (!JWT_SECRET) {
      console.error("NEXTAUTH_SECRET belum diset");
      return null;
    }
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Resolusi user id dari bearer token (dipakai klien API) atau, kalau tidak ada,
 * dari session cookie NextAuth (dipakai website). Tidak pernah percaya user_id
 * yang dikirim client.
 */
export async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const payload = verifyToken(req);
  if (payload?.userId) return payload.userId;

  const session = await getServerSession(authOptions);
  if (session?.user?.id) return Number(session.user.id);

  return null;
}
