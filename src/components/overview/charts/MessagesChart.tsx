'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import type { Theme } from '@/lib/theme';
import type { ChannelTS } from '../types';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function MessagesChart({
  data,
  channelData,
  total,
  avgLatency,
  t,
  isDark,
}: {
  data: { d: string; v: number }[];
  channelData: ChannelTS | null;
  total: number;
  avgLatency: number | null;
  t: Theme;
  isDark: boolean;
}) {
  const [hov, setHov] = useState(false);
  const CHANNEL_COLORS: Record<string, string> = {
    instagram: '#E1306C',
    whatsapp: '#25D366',
    telegram: '#5096F1',
    facebook: '#0084FF',
    youtube: '#FF0000',
    test: '#8B5CF6',
  };

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'area',
        fontFamily: 'Outfit, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        sparkline: { enabled: false },
      },
      colors: [t.chartLinePrimary],
      stroke: { curve: 'smooth', width: 2.5 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 90, 100] },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: t.gridLine,
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      markers: { size: 0, hover: { size: 5 } },
      xaxis: {
        categories: data.map((d) => d.d),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: t.axisText, fontSize: '11px' } },
      },
      yaxis: {
        labels: {
          style: { colors: t.axisText, fontSize: '11px' },
          formatter: (v: number) => (v > 999 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))),
        },
      },
      tooltip: { theme: isDark ? 'dark' : 'light', x: { show: true } },
    }),
    [data, t, isDark],
  );

  const chartSeries = useMemo(
    () => [{ name: 'Messages', data: data.map((d) => d.v) }],
    [data],
  );

  const cardShadow = hov
    ? t.cardHovShadow
    : isDark
      ? '0 2px 12px rgba(0,0,0,0.4)'
      : t.cardShadow;

  return (
    <div
      className='rounded-2xl p-5 relative overflow-hidden transition-all duration-300'
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid ${isDark ? (hov ? t.cardBorderHov : t.cardBorder) : 'rgba(15,23,42,0.08)'}`,
        background: hov ? t.cardHovBg : t.cardBg,
        backdropFilter: isDark ? 'blur(18px) saturate(160%)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(18px) saturate(160%)' : 'none',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: cardShadow,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        {(channelData?.channels || []).map((ch) => (
          <div
            key={ch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: t.textSub,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: CHANNEL_COLORS[ch] || '#64748B',
              }}
            />

            {ch}
          </div>
        ))}
      </div>
      <div className='relative flex items-start justify-between mb-5 gap-3'>
        <div style={{ minWidth: 0 }}>
          <div className='flex items-center gap-2 mb-1.5'>
            <div
              className='h-2 w-2 rounded-full flex-shrink-0'
              style={{
                background: t.chartLinePrimary,
                boxShadow: `0 0 8px ${t.chartLinePrimary}55`,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: t.labelColor,
              }}
            >
              Messages · all channels · daily
            </p>
          </div>
          <p
            className='msg-total'
            style={{
              fontWeight: 900,
              color: t.text,
              letterSpacing: '-1.5px',
              lineHeight: 1,
            }}
          >
            {total.toLocaleString()}
          </p>
          <p style={{ fontSize: 11, color: t.textSub, marginTop: 3 }}>
            {avgLatency != null
              ? `avg ${avgLatency}ms response`
              : 'move cursor over chart to explore'}
          </p>
        </div>
        <span
          style={{
            padding: '5px 12px',
            borderRadius: 999,
            background: isDark ? t.inputBg : 'rgba(248,250,252,0.95)',
            border: `1px solid ${isDark ? t.cardBorder : 'rgba(15,23,42,0.08)'}`,
            fontSize: 11,
            color: t.textSub,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          7 days
        </span>
      </div>
      <div className='relative max-w-full overflow-x-auto custom-scrollbar' style={{ height: 188 }}>
        <ReactApexChart options={chartOptions} series={chartSeries} type='area' height={188} />
      </div>
    </div>
  );
}

