import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSession() {
  const session = await auth();
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}
