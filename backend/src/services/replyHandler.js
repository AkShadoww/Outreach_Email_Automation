'use strict';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

async function classifyReply(replyText, firstName, brandName) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — skipping reply classification');
    return { intent: 'unclear', quoted_rate: null, summary: 'API key not configured' };
  }

  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  const prompt = `You are analyzing a creator's reply to a brand partnership outreach email.

Creator name: ${firstName || 'Unknown'}
Brand: ${brandName || 'Unknown'}

Creator's reply:
"""
${replyText}
"""

Classify the creator's intent as exactly one of:
- "interested": They are interested in the collaboration but haven't given a rate yet
- "not_interested": They declined, are unavailable, or don't want to collaborate
- "quoted_rate": They gave a specific monetary rate/price (e.g. "$500", "my rate is $1000 per post")
- "unclear": The message is ambiguous, off-topic, or you can't determine intent

If "quoted_rate", extract the dollar amount as a number (e.g. 500 for "$500"). If multiple rates are mentioned, use the first/primary one.

Respond with JSON only, no markdown:
{"intent": "...", "quoted_rate": null_or_number, "summary": "one sentence summary"}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Anthropic API error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    const raw = (data.content && data.content[0] && data.content[0].text) || '';
    const cleaned = raw.replace(/^```[\w]*\n?/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(cleaned);

    const validIntents = ['interested', 'not_interested', 'quoted_rate', 'unclear'];
    const intent = validIntents.includes(parsed.intent) ? parsed.intent : 'unclear';
    const quotedRate =
      intent === 'quoted_rate' &&
      typeof parsed.quoted_rate === 'number' &&
      parsed.quoted_rate > 0
        ? parsed.quoted_rate
        : null;

    return { intent, quoted_rate: quotedRate, summary: String(parsed.summary || '') };
  } catch (err) {
    console.error('classifyReply error:', err.message);
    return { intent: 'unclear', quoted_rate: null, summary: `Classification error: ${err.message}` };
  }
}

module.exports = { classifyReply };
