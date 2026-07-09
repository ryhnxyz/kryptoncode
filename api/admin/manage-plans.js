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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.rpc('admin_list_plans');
      if (error) throw error;
      return res.status(200).json({ plans: data });
    }

    if (req.method === 'POST') {
      const { id, name, type, price_usd, bot_id, duration_days, description } = req.body;
      if (!id || !name || !type || price_usd == null) {
        return res.status(400).json({ error: 'id, name, type, and price_usd are required' });
      }
      const { error } = await supabase.rpc('admin_create_plan', {
        p_id: id,
        p_name: name,
        p_type: type,
        p_price: price_usd,
        p_bot_id: bot_id || null,
        p_duration: duration_days || null,
        p_desc: description || ''
      });
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.rpc('admin_delete_plan', { p_id: id });
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
