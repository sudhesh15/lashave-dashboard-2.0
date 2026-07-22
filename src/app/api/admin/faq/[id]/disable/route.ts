import { NextResponse } from "next/server";

const GATEWAY = process.env.GATEWAY_BASE;

function authHeader(req: Request) {
  return req.headers.get("authorization") || "";
}

function passthroughContentType(res: Response) {
  return res.headers.get("content-type") || "application/json";
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const res = await fetch(`${GATEWAY}/admin/faq/${(await ctx.params).id}/disable`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: authHeader(req),
      },
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": passthroughContentType(res) },
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "FAQ disable proxy failed" }, { status: 500 });
  }
}
