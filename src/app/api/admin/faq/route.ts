import { NextResponse } from "next/server";
const GATEWAY = process.env.GATEWAY_BASE;
function authHeader(req: Request) {
  return req.headers.get("authorization") || "";
}
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const upstream = new URL(`${GATEWAY}/admin/faq`);
    url.searchParams.forEach((v, k) => upstream.searchParams.set(k, v));
    const res = await fetch(upstream.toString(), {
      method: "GET",
      headers: { Accept: "application/json", Authorization: authHeader(req) },
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": res.headers.get("content-type") || "application/json" } });
  } catch (e: any) {
    console.error("[FAQ GET]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.log("[FAQ POST] gateway=", GATEWAY, "body=", body);
    const res = await fetch(`${GATEWAY}/admin/faq`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: authHeader(req) },
      body,
    });
    const text = await res.text();
    console.log("[FAQ POST] status=", res.status, "text=", text);
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": res.headers.get("content-type") || "application/json" } });
  } catch (e: any) {
    console.error("[FAQ POST]", e);
    return NextResponse.json({ error: String(e), cause: String((e as any)?.cause) }, { status: 500 });
  }
}
