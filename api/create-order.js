import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `KC-${seg()}-${seg()}-${seg()}`;
}

function generateMemo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `KC${code}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: 'plan_id is required' });
    }

    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Generate license key and memo
    const licenseKey = generateKey();
    const memo = generateMemo();

    // Create the license key record
    const { data: keyData, error: keyError } = await supabase
      .from('license_keys')
      .insert({
        key: licenseKey,
        plan_id: plan_id,
        status: 'unused'
      })
      .select()
      .single();

    if (keyError) {
      return res.status(500).json({ error: 'Failed to create license key', detail: keyError.message });
    }

    // Create payment record with memo
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .insert({
        plan_id: plan_id,
        amount_usd: plan.price_usd,
        crypto_currency: 'USDC',
        chain: 'base',
        memo: memo,
        wallet_address: process.env.CRYPTO_WALLET_ADDRESS || null,
        status: 'pending',
        license_key_id: keyData.id
      })
      .select()
      .single();

    if (payError) {
      return res.status(500).json({ error: 'Failed to create payment', detail: payError.message });
    }

    const walletAddress = process.env.CRYPTO_WALLET_ADDRESS || 'BELUM_DIKONFIGURASI';

    return res.status(200).json({
      success: true,
      order: {
        payment_id: payment.id,
        plan_name: plan.name,
        price_usd: plan.price_usd,
        chain: 'Base',
        currency: 'USDC',
        memo: memo,
        wallet_address: walletAddress,
        license_key: licenseKey,
        status: 'pending',
        instructions: `Kirim ${plan.price_usd} USDC di jaringan Base ke alamat wallet berikut. WAJIB sertakan memo "${memo}" di catatan transaksi agar pembayaran terdeteksi otomatis.`
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
