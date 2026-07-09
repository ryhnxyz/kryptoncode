import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function checkAdmin(req) {
  const pw = req.headers['x-admin-password'];
  return pw && pw === process.env.ADMIN_PASSWORD;
}

function generateApiKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const key = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `kc_live_${key}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.rpc('admin_list_bots');
      if (error) throw error;
      return res.status(200).json({ bots: data });
    }

    if (req.method === 'POST') {
      const { bot_name, bot_username, description } = req.body;
      if (!bot_name) return res.status(400).json({ error: 'bot_name is required' });

      const apiKey = generateApiKey();
      const name = bot_name.toLowerCase().replace(/\s+/g, '-');

      const { data, error } = await supabase.rpc('admin_create_bot', {
        p_key: apiKey,
        p_name: name,
        p_bot_name: bot_name,
        p_bot_username: bot_username || '',
        p_description: description || ''
      });
      if (error) throw error;
      return res.status(200).json({ success: true, bot: data });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.rpc('admin_delete_bot', { p_id: id });
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
