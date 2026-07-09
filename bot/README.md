# Kryptoncode Telegram Bot Template

Template bot Telegram yang **langsung terhubung** ke database Kryptoncode via API. Tinggal isi token dan API key, bot langsung siap pakai.

## Setup Cepat

### 1. Install Dependencies
```bash
cd bot
pip install -r requirements.txt
```

### 2. Konfigurasi
Edit `bot.py` dan isi variabel berikut, atau set sebagai environment variable:

| Variable | Keterangan |
|---|---|
| `BOT_TOKEN` | Token dari @BotFather di Telegram |
| `KRYPTON_API_KEY` | API key dari database Kryptoncode |
| `KRYPTON_API_URL` | URL website (default: `https://kryptoncode.vercel.app`) |

### 3. Jalankan Bot
```bash
python bot.py
```

## Perintah Bot

| Command | Fungsi |
|---|---|
| `/start` | Sambutan dan info bot |
| `/activate <key>` | Aktivasi license key |
| `/check <key>` | Cek status license key |
| `/status` | Info akun user |
| `/help` | Panduan lengkap |

## Cara Kerja

```
User → /activate KC-XXXX-XXXX-XXXX
Bot  → POST /api/activate-key (dengan X-API-Key header)
API  → Cek key di Supabase → Aktifkan → Return result
Bot  → "License key berhasil diaktifkan! 🎉"
```

## Catatan Penting

- **API Key wajib diisi** agar bot bisa berkomunikasi dengan database Kryptoncode
- Setiap bot baru yang Anda buat, cukup copy folder ini dan ganti `BOT_TOKEN`
- `KRYPTON_API_KEY` bisa sama untuk semua bot, atau buat key terpisah per bot
- Bot ini menggunakan long-polling, cocok untuk VPS maupun lokal
