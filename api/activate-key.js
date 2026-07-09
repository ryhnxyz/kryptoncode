import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Middleware: validate API key
async function validateApiKey(req) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return false;

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, is_active')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single();

  return !error && data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key
  const isValid = await validateApiKey(req);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  try {
    const { key, telegram_id, telegram_username } = req.body;

    if (!key || !telegram_id) {
      return res.status(400).json({ error: 'key and telegram_id are required' });
    }

    // Find the license key
    const { data: licenseKey, error: keyError } = await supabase
      .from('license_keys')
      .select('*, plans(*)')
      .eq('key', key.toUpperCase())
      .single();

    if (keyError || !licenseKey) {
      return res.status(404).json({ success: false, error: 'License key tidak ditemukan' });
    }

    if (licenseKey.status === 'active') {
      return res.status(400).json({ success: false, error: 'License key sudah diaktifkan sebelumnya' });
    }
    if (licenseKey.status === 'revoked') {
      return res.status(400).json({ success: false, error: 'License key telah dicabut' });
    }
    if (licenseKey.status === 'expired') {
      return res.status(400).json({ success: false, error: 'License key sudah expired' });
    }

    // Find or create user
    let user;
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    if (existingUser) {
      user = existingUser;
      if (telegram_username && telegram_username !== existingUser.telegram_username) {
        await supabase
          .from('users')
          .update({ telegram_username })
          .eq('id', existingUser.id);
      }
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ telegram_id, telegram_username: telegram_username || null })
        .select()
        .single();

      if (userError) {
        return res.status(500).json({ success: false, error: 'Gagal membuat user', detail: userError.message });
      }
      user = newUser;
    }

    // Calculate expiry
    let expiresAt = null;
    if (licenseKey.plans?.duration_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + licenseKey.plans.duration_days);
    }

    // Activate the key
    const { error: updateError } = await supabase
      .from('license_keys')
      .update({
        user_id: user.id,
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: expiresAt ? expiresAt.toISOString() : null
      })
      .eq('id', licenseKey.id);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Gagal mengaktifkan key', detail: updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'License key berhasil diaktifkan!',
      plan: {
        id: licenseKey.plans?.id,
        name: licenseKey.plans?.name,
        type: licenseKey.plans?.type,
      },
      expires_at: expiresAt ? expiresAt.toISOString() : 'Lifetime',
      user: {
        telegram_id: user.telegram_id,
        telegram_username: user.telegram_username
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
