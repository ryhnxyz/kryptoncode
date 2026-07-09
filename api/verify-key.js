import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { key } = req.query;
      const apiKey = req.headers['x-api-key'];
      if (!key || !apiKey) return res.status(400).json({ error: 'key and X-API-Key header required' });

      const { data, error } = await supabase.rpc('verify_key_for_bot', {
        p_key: key, p_api_key: apiKey
      });
      if (error) throw error;
      const row = data?.[0];
      return res.status(200).json(row || { valid: false, status: 'error' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
