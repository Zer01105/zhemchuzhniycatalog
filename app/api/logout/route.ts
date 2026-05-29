import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.delete("catalog_auth");
  res.cookies.delete("catalog_role");
  res.cookies.delete("catalog_user_id");

  return res;
}
