import { NextResponse } from "next/server";

const GATEWAY = process.env.GATEWAY_BASE;

function authHeader(req: Request) {
  return req.headers.get("authorization") || "";
}

function passthroughContentType(res: Response) {
  return res.headers.get("content-type") || "text/plain";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const res = await fetch(`${GATEWAY}/admin/faq/import`, {
      method: "POST",
      headers: {
        Authorization: authHeader(req),
      },
      body: form as any,
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": passthroughContentType(res) },
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "FAQ import proxy failed" }, { status: 500 });
  }
}
