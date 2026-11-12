// Content moderation for Campora (posts + comments).
//
// Two layers use this same idea:
//  1. This module runs in the browser and blocks abusive text instantly,
//     before anything is sent to the database.
//  2. migration_v8.sql installs the same check inside Postgres (the word
//     list was refreshed by migration_v10.sql), so the database itself
//     rejects abusive rows even if someone skips the app and calls the
//     API directly.
//
// How it works (kept deliberately simple and explainable):
//  - Normalise the text: lowercase + common leetspeak swaps (f*ck, 5hit…).
//  - Split into words and compare WHOLE words against the blocklist, so
//    innocent words that merely contain a bad substring ("class",
//    "assignment") are never blocked.
//  - Also compare a "squeezed" form of each word (repeated letters
//    collapsed: "fuuuck" -> "fuck") and join runs of single letters
//    ("f u c k" -> "fuck"), which closes the usual spacing tricks.

const BLOCKED_WORDS: string[] = [
  // English
  "fuck", "fucker", "fucking", "motherfucker", "shit", "bullshit",
  "bitch", "bastard", "asshole", "dick", "cock", "pussy", "whore",
  "slut", "porn", "porno", "nigger", "nigga", "faggot", "retard",
  "cunt", "wanker", "boobs", "penis", "vagina", "sex", "sexy",
  "nude", "naked", "rape", "rapist", "pedophile", "incest",
  "motherfucking", "fuckin", "arsehole", "dickhead", "shithead",
  // Hinglish / Hindi (roman script)
  "madarchod", "behenchod", "bhenchod", "bhosdike", "bhosdi", "chutiya",
  "chutiye", "gaand", "gand", "gandu", "harami", "haraami", "kamina",
  "kamine", "kutta", "kutti", "saala", "sala", "randi", "loda", "lode",
  "lund", "lavda", "lawda", "lauda", "laude", "jhaant", "jhant",
  "bakchod", "bakchodi", "bhadwa", "bhadwe", "chod", "chodu", "chudai",
  "chud", "chuda", "chude", "chudi", "chudwa", "chudakkad", "chudail",
  "chutiyapa", "muth", "mutthal", "tatte", "bhosda", "bhosde", "gaandu",
  "behnchod", "kutiya", "haramzada", "haramzade", "haramzadi", "saali",
  "maadarchod", "ullu ka pattha", "haramkhor", "kaminey", "nalayak sala",
  // Devanagari script (the tokenizer below keeps Unicode letters, so
  // abuse typed in Hindi script is checked as whole words too)
  "चुद", "चूतिया", "चुदाई", "मादरचोद", "बहनचोद", "भोसडी", "गांड", "गाँडू",
  "हरामी", "कमीना", "कुत्ता", "कुत्ती", "साला", "रंडी", "लौड़ा",
];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

function normalise(raw: string): string {
  return raw
    .toLowerCase()
    .split("")
    .map((ch) => LEET[ch] ?? ch)
    .join("");
}

function squeeze(word: string): string {
  return word.replace(/(.)\1+/g, "$1");
}

const BLOCKED_SET = new Set(BLOCKED_WORDS.map((w) => squeeze(w)));

/** Returns true when the text contains a blocked word. */
export function containsAbuse(raw: string): boolean {
  if (!raw) return false;
  const tokens = normalise(raw)
    .split(/[^\p{L}\p{M}]+/u)
    .filter(Boolean);

  for (const token of tokens) {
    if (BLOCKED_SET.has(token) || BLOCKED_SET.has(squeeze(token))) {
      return true;
    }
  }

  // Multi-word phrases ("ullu ka pattha"): compare against the joined,
  // squeezed token stream so disguised spellings are caught as well.
  const joinedText = tokens.map(squeeze).join(" ");
  for (const phrase of BLOCKED_WORDS) {
    if (phrase.includes(" ") && joinedText.includes(squeeze(phrase))) {
      return true;
    }
  }

  // Spaced-out spellings: "f u c k" arrives as single-letter tokens.
  const joinedSingles = tokens.filter((t) => t.length === 1).join("");
  if (joinedSingles.length >= 3) {
    for (const word of BLOCKED_SET) {
      if (word.length >= 3 && joinedSingles.includes(word)) return true;
    }
  }
  return false;
}

export const ABUSE_ERROR_MESSAGE =
  "This contains abusive language, which is not allowed on Campora. Please rephrase and try again.";

export const NAME_ERROR_MESSAGE =
  "This name contains abusive language, which is not allowed on Campora. Please use a different name.";

export const NSFW_ERROR_MESSAGE =
  "This photo looks inappropriate for a campus feed, so it was not attached. Please choose a different photo.";
