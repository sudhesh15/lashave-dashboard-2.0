import { NextRequest, NextResponse } from 'next/server';

const STAGING = 'https://staging-api.thundertribes.com';
const PASS_HINTS = [
  /duplicate/i,
  /already/i,
  /exists/i,
  /recorded/i,
  /nothing to update/i,
  /not required/i,
  /unnecessary/i,
  /previously accepted/i,
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

function errorText(json: any, text: string, status: number): string {
  return (
    (typeof json?.detail === 'string' && json.detail) ||
    (typeof json?.message === 'string' && json.message) ||
    (typeof json?.error === 'string' && json.error) ||
    (Array.isArray(json?.detail) &&
      json.detail
        .map((d: any) =>
          typeof d === 'string'
            ? d
            : typeof d?.msg === 'string'
              ? `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`
              : JSON.stringify(d),
        )
        .join(' | ')) ||
    text.slice(0, 800) ||
    `HTTP ${status}`
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    const res = await fetch(`${STAGING}/admin/processing-acceptance`, {
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

    const hint = errorText(json, text, res.status);

    if (res.ok) {
      return NextResponse.json(json ?? { ok: true });
    }

    const isDuplicate = PASS_HINTS.some((re) => re.test(hint));

    console.warn(
      `[processing-acceptance] staging HTTP ${res.status}: ${hint} [duplicate-safe=${isDuplicate}]`,
    );

    if (isDuplicate) {
      return NextResponse.json({
        ok: true,
        accepted: true,
        warning: 'Treated as success because acceptance was already recorded.',
        staging_status: res.status,
        staging_hint: hint,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: `Could not record legal acceptance. ${hint}`,
        staging_status: res.status,
        staging_body: json ?? text,
        request_body_summary: {
          platform: typeof body.platform === 'string' ? body.platform : null,
          channel: typeof body.channel === 'string' ? body.channel : null,
          accepted: body.accepted ?? null,
          acknowledged: body.acknowledged ?? null,
          privacy_url_type:
            typeof body.privacy_notice_url === 'string'
              ? body.privacy_notice_url.length > 0
                ? 'string'
                : 'empty-string'
              : typeof body.privacy_notice_url,
          dpa_version: body.dpa_version ?? null,
          accepted_version: body.accepted_version ?? null,
          source: typeof body.source === 'string' ? body.source : null,
        },
      },
      { status: 422 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[processing-acceptance] fetch threw:`, msg);
    return NextResponse.json(
      {
        ok: false,
        error: `Network error calling staging DPA endpoint: ${msg}`,
      },
      { status: 502 },
    );
  }
}
