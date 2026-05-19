// Pulls brands + campaigns from campaigns.influence.technology and upserts
// them into the local campaigns table.
//
// Upstream contract (GET /api/bot/campaigns with x-bot-token header):
//   { campaigns: [ { id, name, brandName, slug, ... } ] }
// We persist the id, name, brandName, slug and stash the full payload in
// `data` for later reference.

const db = require('../db');

const baseUrl = () =>
  (process.env.CAMPAIGNS_API_BASE || 'https://campaigns.influence.technology').replace(/\/$/, '');

async function fetchUpstreamCampaigns() {
  const token = process.env.CAMPAIGNS_API_TOKEN;
  if (!token) throw new Error('CAMPAIGNS_API_TOKEN is not set');

  const resp = await fetch(`${baseUrl()}/api/bot/campaigns`, {
    headers: { 'x-bot-token': token, Accept: 'application/json' },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Upstream ${resp.status} ${resp.statusText}: ${body.slice(0, 200)}`);
  }
  const json = await resp.json();
  if (!json || !Array.isArray(json.campaigns)) {
    throw new Error('Upstream response missing campaigns array');
  }
  return json.campaigns;
}

async function syncCampaigns() {
  const campaigns = await fetchUpstreamCampaigns();
  let upserted = 0;
  for (const c of campaigns) {
    if (!c.id || !c.name || !c.brandName) continue;
    await db.query(
      `INSERT INTO campaigns (id, name, brand_name, slug, data, synced_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         brand_name = EXCLUDED.brand_name,
         slug = EXCLUDED.slug,
         data = EXCLUDED.data,
         synced_at = NOW()`,
      [c.id, c.name, c.brandName, c.slug || null, c],
    );
    upserted += 1;
  }
  return { upserted, fetched: campaigns.length };
}

module.exports = { syncCampaigns, fetchUpstreamCampaigns };
