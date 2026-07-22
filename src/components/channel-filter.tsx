"use client";

import { useEffect, useState, useCallback } from "react";
import { Radio } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
export type ChannelFilterValue = {
  channel: string | null;
  channel_id: number | null;
};

type ChannelItem = {
  id: number;
  platform: string;
  platform_account_id: string;
  display_name: string;
  is_active: boolean;
};

// ── Platform config ────────────────────────────────────────────────────────────
const PLATFORM_CFG: Record<string, { logoSrc: string; label: string }> = {
  instagram: { logoSrc: "/brand-logo/instagram.png", label: "Instagram" },
  youtube: { logoSrc: "/brand-logo/youtube.png", label: "YouTube" },
  whatsapp: { logoSrc: "/brand-logo/whatsapp.png", label: "WhatsApp" },
  telegram: { logoSrc: "/brand-logo/telegram.png", label: "Telegram" },
  facebook: { logoSrc: "/brand-logo/facebook.png", label: "Facebook" },
  website: { logoSrc: "/brand-logo/website.png", label: "Website" },
  meta: { logoSrc: "/brand-logo/meta.png", label: "Meta" },
  google: { logoSrc: "/brand-logo/google-map.png", label: "Google" },
};

const DEFAULT_CFG = { logoSrc: null as string | null, label: "Channel" };

function getPlatformCfg(platform: string) {
  return PLATFORM_CFG[platform?.toLowerCase()] ?? { ...DEFAULT_CFG, label: platform || "Channel" };
}

function channelLabel(c: ChannelItem): string {
  if (c.display_name && c.display_name.trim()) return c.display_name.trim();
  return getPlatformCfg(c.platform).label;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ChannelFilter({
  value,
  onChange,
  counts,
  totalCount,
  className,
}: {
  value: ChannelFilterValue;
  onChange: (v: ChannelFilterValue) => void;
  counts?: Record<number, number>;
  totalCount?: number;
  className?: string;
}) {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: ChannelItem[] }>("/admin/channels", { auth: true });
      const filteredItems = (data.items || []).filter(
        (item) => item.platform?.toLowerCase() !== 'google',
      );
      setChannels((filteredItems || []).filter((c) => c.is_active));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && channels.length === 0) return null;

  const isAll = value.channel === null && value.channel_id === null;

  const rowClass = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition",
      active
        ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]",
    );

  return (
    <div className={cn("flex w-full flex-col gap-0.5", className)}>
      <button type="button" onClick={() => onChange({ channel: null, channel_id: null })} className={rowClass(isAll)}>
        <span className="inline-flex items-center gap-2">
          <Radio className="h-4 w-4" />
          All channels
        </span>
        {totalCount != null && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{totalCount}</span>
        )}
      </button>

      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="mx-3 my-1 h-4 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]"
            />
          ))
        : channels.map((c) => {
            const cfg = getPlatformCfg(c.platform);
            const active = value.channel_id === c.id;
            const label = channelLabel(c);
            const count = counts?.[c.id] ?? 0;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  onChange(
                    active
                      ? { channel: null, channel_id: null }
                      : { channel: c.platform, channel_id: c.id },
                  )
                }
                title={`${cfg.label} · ${c.platform_account_id}`}
                className={rowClass(active)}
              >
                <span className="inline-flex items-center gap-2">
                  {cfg.logoSrc ? (
                    <img src={cfg.logoSrc} alt={cfg.label} className="h-4 w-4 shrink-0 rounded-sm object-contain" />
                  ) : (
                    <Radio className="h-4 w-4 shrink-0" />
                  )}
                  {label}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
              </button>
            );
          })}
    </div>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useChannelFilter() {
  const [filter, setFilter] = useState<ChannelFilterValue>({
    channel: null,
    channel_id: null,
  });

  const queryParams = useCallback((): string => {
    const parts: string[] = [];
    if (filter.channel) parts.push(`channel=${encodeURIComponent(filter.channel)}`);
    if (filter.channel_id !== null) parts.push(`channel_id=${filter.channel_id}`);
    return parts.length ? `&${parts.join("&")}` : "";
  }, [filter]);

  return { filter, setFilter, queryParams };
}
