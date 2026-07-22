import { NextResponse } from "next/server";

const GATEWAY = process.env.GATEWAY_BASE;

function authHeader(req: Request) {
  return req.headers.get("authorization") || "";
}

function passthroughContentType(res: Response) {
  return res.headers.get("content-type") || "application/json";
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.text();

    const res = await fetch(`${GATEWAY}/admin/faq/${(await ctx.params).id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader(req),
      },
      body,
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": passthroughContentType(res) },
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "FAQ PUT proxy failed" }, { status: 500 });
  }
}
