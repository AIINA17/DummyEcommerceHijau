import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

/** User id dari session cookie, atau null kalau belum login. */
export async function currentUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? Number(session.user.id) : null;
}
