const express = require('express');
const {
  getGuidelines,
  getAiRepliesEnabled,
  setAiRepliesEnabled,
  setSetting,
  GUIDELINES_KEY,
} = require('../services/settings');

const router = express.Router();

// Current app-wide settings: the universal Guidelines prompt and the global
// AI auto-reply kill-switch.
router.get('/', async (_req, res, next) => {
  try {
    res.json({
      guidelines: await getGuidelines(),
      ai_replies_enabled: await getAiRepliesEnabled(),
    });
  } catch (err) {
    next(err);
  }
});

// Save the universal Guidelines prompt.
router.put('/guidelines', async (req, res, next) => {
  try {
    const raw = (req.body || {}).guidelines;
    if (raw != null && typeof raw !== 'string') {
      return res.status(400).json({ error: 'guidelines must be a string' });
    }
    await setSetting(GUIDELINES_KEY, raw == null ? '' : raw);
    res.json({ guidelines: await getGuidelines() });
  } catch (err) {
    next(err);
  }
});

// Flip the global AI auto-reply kill-switch. When false, every creator reply
// goes to the Delegate window instead of getting an auto-generated response.
router.put('/ai-replies-enabled', async (req, res, next) => {
  try {
    const raw = (req.body || {}).enabled;
    if (typeof raw !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }
    await setAiRepliesEnabled(raw);
    res.json({ ai_replies_enabled: await getAiRepliesEnabled() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
