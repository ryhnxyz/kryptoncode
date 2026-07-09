import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = req.headers['x-api-key'];
    const { key, telegram_id, telegram_username } = req.body;
    if (!key || !telegram_id || !apiKey) {
      return res.status(400).json({ error: 'key, telegram_id, and X-API-Key header required' });
    }

    const { data, error } = await supabase.rpc('activate_key_for_bot', {
      p_key: key,
      p_api_key: apiKey,
      p_telegram_id: telegram_id,
      p_telegram_username: telegram_username || null
    });
    if (error) throw error;
    const row = data?.[0];
    if (!row) return res.status(500).json({ success: false, error: 'No response from DB' });

    return res.status(row.success ? 200 : 400).json({
      success: row.success,
      message: row.message,
      plan_name: row.plan_name,
      plan_type: row.plan_type,
      expires_at: row.expires_at_result || 'Lifetime'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
