/**
 * Typed shapes for the JSONB columns on profiles.
 * These match the DB defaults and are used in settings + display pages.
 * [SQ.S-W-2603-0038..0041]
 */

export interface Factoid {
  category: string;
  emoji: string;
  value: string;
}

export interface LikeDislike {
  emoji: string;
  text: string;
}

/** Preset factoid categories users can pick from */
export const FACTOID_CATEGORIES = [
  { label: "Based in", emoji: "📍" },
  { label: "Hobby", emoji: "🎨" },
  { label: "Fuel", emoji: "☕" },
  { label: "Superpower", emoji: "🎯" },
  { label: "Currently reading", emoji: "📚" },
  { label: "Currently watching", emoji: "📺" },
  { label: "Currently building", emoji: "🔨" },
  { label: "Favourite food", emoji: "🍕" },
  { label: "Favourite drink", emoji: "🍹" },
  { label: "Music taste", emoji: "🎵" },
  { label: "Pet", emoji: "🐾" },
  { label: "Star sign", emoji: "⭐" },
  { label: "MBTI", emoji: "🧠" },
  { label: "Enneagram", emoji: "🔢" },
  { label: "Languages", emoji: "🌍" },
  { label: "Fun fact", emoji: "💡" },
  { label: "Dream destination", emoji: "✈️" },
  { label: "Guilty pleasure", emoji: "🙈" },
  { label: "Go-to karaoke", emoji: "🎤" },
  { label: "Morning or night", emoji: "🌅" },
  { label: "Introvert or extrovert", emoji: "💬" },
  { label: "Side project", emoji: "🚀" },
  { label: "Podcast", emoji: "🎧" },
  { label: "Tool I can't live without", emoji: "🛠️" },
  { label: "Unpopular opinion", emoji: "🔥" },
] as const;
