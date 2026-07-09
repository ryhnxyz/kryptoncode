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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key
  const isValid = await validateApiKey(req);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ error: 'key parameter is required' });
    }

    const { data: licenseKey, error } = await supabase
      .from('license_keys')
      .select('*, plans(*)')
      .eq('key', key.toUpperCase())
      .single();

    if (error || !licenseKey) {
      return res.status(404).json({ valid: false, error: 'License key not found' });
    }

    // Check expiry
    if (licenseKey.expires_at && new Date(licenseKey.expires_at) < new Date()) {
      await supabase
        .from('license_keys')
        .update({ status: 'expired' })
        .eq('id', licenseKey.id);

      return res.status(200).json({
        valid: false,
        status: 'expired',
        plan: licenseKey.plans?.name,
        expired_at: licenseKey.expires_at
      });
    }

    return res.status(200).json({
      valid: licenseKey.status === 'active',
      status: licenseKey.status,
      plan: {
        id: licenseKey.plans?.id,
        name: licenseKey.plans?.name,
        type: licenseKey.plans?.type,
      },
      activated_at: licenseKey.activated_at,
      expires_at: licenseKey.expires_at
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
