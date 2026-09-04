import { NextRequest, NextResponse } from 'next/server';

const STAGING = 'https://staging-api.thundertribes.com';
const ALLOWED_CHANNELS = new Set([
  'facebook',
  'instagram',
  'google',
  'telegram',
  'whatsapp',
  'youtube',
  'website',
]);
const DPA_PASS_HINTS = [
  /duplicate/i,
  /already/i,
  /exists/i,
  /recorded/i,
  /nothing to update/i,
  /not required/i,
  /unnecessary/i,
];

function authHeaders(req: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) out.authorization = auth;
  const cookie = req.headers.get('cookie');
  if (cookie) out.cookie = cookie;
  const tenant = req.headers.get('x-tenant-id');
  if (tenant) out['x-tenant-id'] = tenant;
  const user = req.headers.get('x-user-id');
  if (user) out['x-user-id'] = user;
  out.accept = 'application/json';
  out['content-type'] = 'application/json';
  return out;
}

export async function POST(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const channelMatch = pathname.match(
    /\/api\/admin\/channels\/([^/]+)\/connect/,
  );
  const channel = channelMatch ? decodeURIComponent(channelMatch[1]) : null;

  if (!channel) {
    return NextResponse.json(
      { ok: false, error: 'Missing channel in URL path.' },
      { status: 400 },
    );
  }

  const normalized = channel.toLowerCase();
  const backendChannel = normalized === 'google reviews' ? 'google' : normalized;

  if (!ALLOWED_CHANNELS.has(backendChannel)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported channel: ${backendChannel}` },
      { status: 400 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    const res = await fetch(`${STAGING}/admin/channels/${backendChannel}/connect`, {
      method: 'POST',
      headers: authHeaders(req),
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    const errorHint =
      (typeof json?.detail === 'string' && json.detail) ||
      (typeof json?.message === 'string' && json.message) ||
      (typeof json?.error === 'string' && json.error) ||
      text.slice(0, 500) ||
      `HTTP ${res.status}`;

    if (!res.ok) {
      console.error(
        `[channels/${backendChannel}/connect] staging HTTP ${res.status}:`,
        errorHint,
      );
      return NextResponse.json(
        {
          ok: false,
          error: `Staging connect failed (HTTP ${res.status}): ${errorHint}`,
          staging_status: res.status,
          staging_body: json ?? text,
        },
        { status: 502 },
      );
    }

    if (json?.auth_url) {
      return NextResponse.json(json);
    }

    return NextResponse.json({
      ok: true,
      staging_status: res.status,
      auth_url: json?.auth_url ?? null,
      staging_body: json ?? text,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[channels/${backendChannel}/connect] fetch threw:`, msg);
    return NextResponse.json(
      {
        ok: false,
        error: `Network error calling staging connect: ${msg}`,
      },
      { status: 502 },
    );
  }
}
