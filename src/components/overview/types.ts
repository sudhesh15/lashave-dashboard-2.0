export type Overview = {
  total_conversations: number;
  open_conversations: number;
  total_messages: number;
  avg_latency_ms: number | null;
  total_leads: number;
  total_handoffs: number;
  total_errors: number;
  total_complaints: number;
};

export type Pipeline = {
  by_status: { status: string; count: number }[];
  total_leads: number;
};

export type TS = { points: { t: string; v: number }[] };

export type ChannelTS = {
  channels: string[];
  points: {
    t: string;
    channel: string;
    v: number;
  }[];
};

export type ChannelInfo = {
  id: number;
  platform: string;
  is_active: boolean;
  account_name?: string;
  display_name?: string;
  username?: string;
};

export type BizType =
  | 'restaurant'
  | 'ecommerce'
  | 'salon'
  | 'realestate'
  | 'clinic'
  | 'influencer'
  | 'education'
  | 'fitness'
  | 'automobile'
  | 'travel'
  | 'legal'
  | 'finance'
  | 'other';
