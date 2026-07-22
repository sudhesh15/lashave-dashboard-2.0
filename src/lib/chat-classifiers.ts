/**
 * chat-classifiers.ts
 * Shared mood + category classification for leads and conversation pages.
 * Keyword lists are kept in sync with backend app.py detect_mood().
 * Save this to: lib/chat-classifiers.ts
 */

export type Mood = {
  mood: string; // "frustrated" | "urgent" | "excited" | "happy" | "confused" | "cold" | "neutral"
  emoji: string;
  color: string;
  label: string;
};

export type Category = 'complaint' | 'feedback' | 'order' | 'enquiry' | 'none';

// ─────────────────────────────────────────────────────────────────────────────
// MOOD — identical keyword sets to backend detect_mood() in app.py
// ─────────────────────────────────────────────────────────────────────────────
const MOOD_RULES: {
  mood: Mood['mood'];
  emoji: string;
  color: string;
  label: string;
  keywords: string[];
}[] = [
  {
    mood: 'frustrated',
    emoji: '😤',
    color: '#f87171',
    label: 'Frustrated',
    keywords: [
      'not working',
      'broken',
      'terrible',
      'awful',
      'hate',
      'waste',
      'scam',
      'useless',
      'frustrated',
      'ridiculous',
      'wtf',
      'horrible',
      'disappointing',
      'worst',
      'garbage',
      'fed up',
      'sick of',
      'annoying',
      'pathetic',
      'rubbish',
      'complaint',
      'failed',
      "doesn't work",
      'not happy',
      'very bad',
    ],
  },
  {
    mood: 'urgent',
    emoji: '🔥',
    color: '#fb923c',
    label: 'Urgent',
    keywords: [
      'urgent',
      'asap',
      'immediately',
      'right now',
      'emergency',
      'critical',
      'deadline',
      'today',
      'tonight',
      'this week',
      'as soon as',
      'need it now',
      'by tomorrow',
      "can't wait",
      'urgently',
    ],
  },
  {
    mood: 'excited',
    emoji: '🤩',
    color: '#34d399',
    label: 'Excited',
    keywords: [
      'amazing',
      'love it',
      'excited',
      'perfect',
      'awesome',
      'definitely',
      'absolutely',
      'brilliant',
      'fantastic',
      "let's do it",
      'sign me up',
      'where do i',
      'great idea',
      'exactly what',
      'this is what',
      "can't wait",
      'sounds great',
      'love this',
    ],
  },
  {
    mood: 'happy',
    emoji: '😊',
    color: '#a78bfa',
    label: 'Happy',
    keywords: [
      'thanks',
      'thank you',
      'great',
      'good',
      'nice',
      'happy',
      'appreciate',
      'helpful',
      'works',
      'love',
      'like',
      'cool',
      'sounds good',
      "that's good",
      'okay great',
      'cheers',
      'brilliant thanks',
    ],
  },
  {
    mood: 'confused',
    emoji: '🤔',
    color: '#fbbf24',
    label: 'Confused',
    keywords: [
      'confused',
      "don't understand",
      'not sure',
      'what do you mean',
      'how does',
      'explain',
      'what is',
      "i don't get",
      'unclear',
      'could you clarify',
      'what exactly',
      'lost',
      '??',
      'help me understand',
      'not clear',
      "didn't understand",
    ],
  },
  {
    mood: 'cold',
    emoji: '🥶',
    color: '#94a3b8',
    label: 'Cold',
    keywords: [
      'not interested',
      'no thanks',
      'not now',
      'maybe later',
      'just browsing',
      'just looking',
      'nevermind',
      'forget it',
      "don't need",
      'not relevant',
      'not for me',
      'no need',
    ],
  },
];

const NEUTRAL_MOOD: Mood = {
  mood: 'neutral',
  emoji: '😐',
  color: '#64748b',
  label: 'Neutral',
};

/**
 * Classify mood from raw text (one or more messages joined).
 * Matches the backend's priority order exactly.
 */
export function classifyMood(text: string): Mood {
  const t = (text || '').toLowerCase();
  for (const rule of MOOD_RULES) {
    if (rule.keywords.some((kw) => t.includes(kw))) {
      return {
        mood: rule.mood,
        emoji: rule.emoji,
        color: rule.color,
        label: rule.label,
      };
    }
  }
  return NEUTRAL_MOOD;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY — weighted multi-signal scoring
// ─────────────────────────────────────────────────────────────────────────────

// Define the icons directly or import them from an icon library like lucide-react

import {
  AlertCircle,
  HelpCircle,
  Layers,
  MessageSquare,
  ShoppingCart,
} from 'lucide-react';
import React from 'react';

//emoji to icon change
export const CATEGORY_CFG: Record<
  Category,
  {
    label: string;
    // Update the type to accept a pre-rendered ReactNode instead of a component class
    icon: React.ReactNode;
    color: string;
    bg: string;
  }
> = {
  complaint: {
    label: 'Complaint',

    icon: React.createElement(AlertCircle, { className: 'w-6 h-6' }),
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
  feedback: {
    label: 'Feedback',
    icon: React.createElement(MessageSquare, { className: 'w-6 h-6' }),
    color: '#a78bfa',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  order: {
    label: 'Order',
    icon: React.createElement(ShoppingCart, { className: 'w-6 h-6' }),
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  enquiry: {
    label: 'Enquiry',
    icon: React.createElement(HelpCircle, { className: 'w-6 h-6' }),
    color: '#67e8f9',
    bg: 'rgba(6, 182, 212, 0.12)',
  },
  none: {
    label: 'General',
    icon: React.createElement(Layers, { className: 'w-6 h-6' }),
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
  },
};

// Weighted keyword sets — weight 2 = strong signal, weight 1 = soft signal
const CATEGORY_RULES: Record<
  Exclude<Category, 'none'>,
  { kw: string; w: number }[]
> = {
  complaint: [
    // Strong
    { kw: 'not working', w: 3 },
    { kw: 'broken', w: 3 },
    { kw: 'complaint', w: 3 },
    { kw: "doesn't work", w: 3 },
    { kw: 'not happy', w: 3 },
    { kw: 'refund', w: 3 },
    { kw: 'scam', w: 3 },
    { kw: 'rip off', w: 3 },
    { kw: 'terrible', w: 2 },
    { kw: 'awful', w: 2 },
    { kw: 'horrible', w: 2 },
    { kw: 'worst', w: 2 },
    { kw: 'disappointed', w: 2 },
    { kw: 'frustrating', w: 2 },
    { kw: 'failed', w: 2 },
    // Soft
    { kw: 'error', w: 1 },
    { kw: 'issue', w: 1 },
    { kw: 'bug', w: 1 },
    { kw: 'problem', w: 1 },
    { kw: 'wrong', w: 1 },
    { kw: 'bad', w: 1 },
    { kw: 'annoying', w: 1 },
    { kw: 'useless', w: 1 },
    { kw: 'hate', w: 1 },
  ],
  feedback: [
    { kw: 'feedback', w: 3 },
    { kw: 'suggestion', w: 3 },
    { kw: 'feature request', w: 3 },
    { kw: 'improve', w: 2 },
    { kw: 'improvement', w: 2 },
    { kw: 'would be nice', w: 2 },
    { kw: 'you should', w: 2 },
    { kw: 'could you add', w: 2 },
    { kw: 'please add', w: 2 },
    { kw: 'missing feature', w: 2 },
    { kw: 'recommend', w: 2 },
    { kw: 'review', w: 2 },
    { kw: 'rating', w: 1 },
    { kw: 'experience', w: 1 },
    { kw: 'thoughts on', w: 1 },
    { kw: 'opinion', w: 1 },
    { kw: 'love the', w: 1 },
    { kw: 'great product', w: 1 },
    { kw: 'great service', w: 1 },
    { kw: 'what if', w: 1 },
  ],
  order: [
    { kw: 'order', w: 3 },
    { kw: 'purchase', w: 3 },
    { kw: 'buy', w: 2 },
    { kw: 'payment', w: 3 },
    { kw: 'invoice', w: 3 },
    { kw: 'receipt', w: 2 },
    { kw: 'subscription', w: 3 },
    { kw: 'plan', w: 2 },
    { kw: 'package', w: 2 },
    { kw: 'how much', w: 2 },
    { kw: "what's the price", w: 3 },
    { kw: 'pricing', w: 2 },
    { kw: 'cost', w: 1 },
    { kw: 'quote', w: 2 },
    { kw: 'checkout', w: 2 },
    { kw: 'shipping', w: 2 },
    { kw: 'delivery', w: 2 },
    { kw: 'refund', w: 2 },
    { kw: 'cancel', w: 2 },
    { kw: 'return', w: 2 },
    { kw: 'bought', w: 2 },
    { kw: 'pay', w: 1 },
    { kw: 'fee', w: 1 },
    { kw: 'budget', w: 1 },
  ],
  enquiry: [
    { kw: 'how does', w: 2 },
    { kw: 'how do', w: 2 },
    { kw: 'what is', w: 2 },
    { kw: 'can you', w: 1 },
    { kw: 'do you', w: 1 },
    { kw: 'more info', w: 2 },
    { kw: 'information', w: 1 },
    { kw: 'details', w: 1 },
    { kw: 'learn more', w: 2 },
    { kw: 'interested in', w: 2 },
    { kw: 'looking for', w: 2 },
    { kw: 'tell me', w: 1 },
    { kw: 'explain', w: 1 },
    { kw: 'need help', w: 2 },
    { kw: 'question', w: 2 },
    { kw: 'wondering', w: 1 },
    { kw: 'curious', w: 1 },
    { kw: 'demo', w: 3 },
    { kw: 'call', w: 1 },
    { kw: 'meeting', w: 2 },
    { kw: 'schedule', w: 2 },
    { kw: 'consult', w: 2 },
    { kw: 'book', w: 1 },
    { kw: 'appointment', w: 2 },
  ],
};

// Intent → category direct mapping (only used when score is 0 to avoid overriding strong signals)
const INTENT_CATEGORY: Record<string, Exclude<Category, 'none'>> = {
  support: 'complaint',
  pricing: 'order',
  demo: 'enquiry',
  integration: 'enquiry',
  general_interest: 'enquiry',
};

export function detectCategory(params: {
  text_preview?: string;
  triggers?: string[];
  intent?: string;
  service?: string;
  mood?: string; // mood.mood value
  contacts?: { emails?: string[]; phones?: string[] };
}): Category {
  const {
    text_preview,
    triggers = [],
    intent = '',
    service = '',
    mood,
    contacts,
  } = params;

  // Build a rich haystack from all available signals
  const haystack = [
    text_preview || '',
    ...triggers,
    // Don't include intent/service in haystack — they're used separately
  ]
    .join(' ')
    .toLowerCase();

  // Score each category
  const scores: Record<Exclude<Category, 'none'>, number> = {
    complaint: 0,
    feedback: 0,
    order: 0,
    enquiry: 0,
  };

  for (const [cat, rules] of Object.entries(CATEGORY_RULES) as [
    Exclude<Category, 'none'>,
    { kw: string; w: number }[],
  ][]) {
    for (const { kw, w } of rules) {
      if (haystack.includes(kw)) scores[cat] += w;
    }
  }

  // Mood boosts
  if (mood === 'frustrated') scores.complaint += 4;
  if (mood === 'urgent') scores.complaint += 2;
  if (mood === 'excited') scores.enquiry += 1;

  // Has contact info? Boosts enquiry/order (they're trying to do business)
  if (contacts?.emails?.length || contacts?.phones?.length) {
    scores.enquiry += 1;
    scores.order += 1;
  }

  // Strong trigger signals from backend
  if (triggers.some((t) => t.includes('strong:pricing'))) scores.order += 4;
  if (triggers.some((t) => t.includes('strong:demo'))) scores.enquiry += 4;
  if (triggers.some((t) => t.startsWith('intent:support')))
    scores.complaint += 3;
  if (triggers.some((t) => t.startsWith('intent:pricing'))) scores.order += 2;
  if (triggers.some((t) => t.startsWith('intent:demo'))) scores.enquiry += 2;

  // Find best scoring category
  const best = (
    Object.entries(scores) as [Exclude<Category, 'none'>, number][]
  ).sort((a, b) => b[1] - a[1])[0];

  // Only use score if it's meaningful (≥ 2), else fall back to intent mapping
  if (best[1] >= 2) return best[0];

  // Fallback: intent direct mapping
  if (intent && INTENT_CATEGORY[intent]) return INTENT_CATEGORY[intent];

  return 'none';
}

/**
 * Resolve mood for a lead — uses stored mood if non-neutral, otherwise
 * re-classifies from all available text signals.
 */
export function resolveMoodForLead(params: {
  storedMood?: Mood | null;
  text_preview?: string;
  triggers?: string[];
  intent?: string;
  messages?: { role: string; content: string }[];
}): Mood {
  const {
    storedMood,
    text_preview,
    triggers = [],
    intent = '',
    messages = [],
  } = params;

  // Trust non-neutral stored mood
  if (storedMood && storedMood.label && storedMood.label !== 'Neutral')
    return storedMood;

  // If we have actual messages, scan all user messages (most accurate)
  if (messages.length > 0) {
    const userText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');
    const fromMessages = classifyMood(userText);
    if (fromMessages.mood !== 'neutral') return fromMessages;
  }

  // Otherwise scan text_preview + triggers
  const haystack = [text_preview || '', ...triggers].join(' ');
  const fromHaystack = classifyMood(haystack);
  if (fromHaystack.mood !== 'neutral') return fromHaystack;

  // Use intent as a last-resort hint
  if (intent === 'support')
    return {
      mood: 'frustrated',
      emoji: '😤',
      color: '#f87171',
      label: 'Frustrated',
    };
  if (intent === 'pricing' || intent === 'demo')
    return { mood: 'excited', emoji: '🤩', color: '#34d399', label: 'Excited' };

  return storedMood || NEUTRAL_MOOD;
}
