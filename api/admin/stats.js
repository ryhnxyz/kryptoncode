import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function checkAdmin(req) {
  const pw = req.headers['x-admin-password'];
  return pw && pw === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data, error } = await supabase.rpc('admin_stats');
    if (error) throw error;
    return res.status(200).json(data?.[0] || {});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
