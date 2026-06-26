'use strict';

// Tiny key/value store backed by the app_settings table. Holds the universal
// negotiation "Guidelines" prompt and the global AI-auto-reply kill-switch.

const db = require('../db');

const GUIDELINES_KEY = 'negotiation_guidelines';
const AI_REPLIES_KEY = 'ai_replies_enabled';

async function getSetting(key) {
  const row = await db.one(`SELECT value FROM app_settings WHERE key = $1`, [key]);
  return row ? row.value : null;
}

async function setSetting(key, value) {
  await db.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value],
  );
}

// Universal guidelines injected into every Claude negotiation prompt. Empty
// string when unset (callers treat empty as "no guidelines"). Never throws —
// a missing table / DB hiccup degrades to no guidelines.
async function getGuidelines() {
  try {
    const v = await getSetting(GUIDELINES_KEY);
    return typeof v === 'string' ? v : '';
  } catch (err) {
    console.error('[settings] getGuidelines failed:', err.message);
    return '';
  }
}

// Global kill-switch for AI auto-replies. Default TRUE on first boot — the
// negotiation flow auto-replies unless an admin turns it off in the
// dashboard. Never throws; a missing table / hiccup degrades open (AI on).
async function getAiRepliesEnabled() {
  try {
    const v = await getSetting(AI_REPLIES_KEY);
    if (v == null) return true;
    return v !== false && v !== 'false';
  } catch (err) {
    console.error('[settings] getAiRepliesEnabled failed:', err.message);
    return true;
  }
}

async function setAiRepliesEnabled(enabled) {
  await setSetting(AI_REPLIES_KEY, !!enabled);
}

module.exports = {
  getSetting,
  setSetting,
  getGuidelines,
  getAiRepliesEnabled,
  setAiRepliesEnabled,
  GUIDELINES_KEY,
  AI_REPLIES_KEY,
};
