# Kryptoncode Telegram Bot Template
# ====================================
# Template bot yang langsung terhubung ke database Kryptoncode
# via API. Tinggal isi BOT_TOKEN dan KRYPTON_API_KEY.
#
# Instalasi:
#   pip install python-telegram-bot requests
#
# Jalankan:
#   python bot.py

import os
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# ============================================================
# KONFIGURASI - ISI INI SEBELUM MENJALANKAN BOT
# ============================================================
BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
KRYPTON_API_KEY = os.getenv("KRYPTON_API_KEY", "YOUR_KRYPTON_API_KEY")
KRYPTON_API_URL = os.getenv("KRYPTON_API_URL", "https://kryptoncode.vercel.app")

# ============================================================
# LOGGING
# ============================================================
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ============================================================
# HELPER: Panggil API Kryptoncode
# ============================================================
def krypton_request(method, endpoint, **kwargs):
    """Helper untuk request ke Kryptoncode API dengan API key."""
    headers = {
        "X-API-Key": KRYPTON_API_KEY,
        "Content-Type": "application/json"
    }
    url = f"{KRYPTON_API_URL}{endpoint}"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, params=kwargs.get("params"))
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=kwargs.get("json"))
        
        return resp.json()
    except Exception as e:
        logger.error(f"API Error: {e}")
        return {"error": str(e)}

# ============================================================
# COMMANDS
# ============================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler untuk /start - Registrasi dan sambutan."""
    user = update.effective_user
    
    text = (
        f"👋 Halo, {user.first_name}!\n\n"
        f"Selamat datang di bot Kryptoncode.\n"
        f"Bot ini membutuhkan license key untuk mengakses fitur premium.\n\n"
        f"📋 *Perintah yang tersedia:*\n"
        f"/activate `<key>` — Aktivasi license key\n"
        f"/status — Cek status membership\n"
        f"/help — Bantuan\n\n"
        f"Belum punya license key? Kunjungi website kami untuk membeli."
    )
    
    keyboard = [[
        InlineKeyboardButton("🌐 Beli License Key", url=f"{KRYPTON_API_URL}/premium"),
        InlineKeyboardButton("💬 Support", url="https://t.me/kryptoncodes"),
    ]]
    
    await update.message.reply_text(
        text,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def activate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler untuk /activate <key> - Aktivasi license key."""
    user = update.effective_user
    
    if not context.args:
        await update.message.reply_text(
            "⚠️ Format salah!\n\n"
            "Gunakan: `/activate KC-XXXX-XXXX-XXXX`",
            parse_mode="Markdown"
        )
        return
    
    key = context.args[0].upper()
    
    await update.message.reply_text("⏳ Memverifikasi license key...")
    
    result = krypton_request("POST", "/api/activate-key", json={
        "key": key,
        "telegram_id": user.id,
        "telegram_username": user.username or ""
    })
    
    if result.get("success"):
        plan = result.get("plan", {})
        expires = result.get("expires_at", "Lifetime")
        
        await update.message.reply_text(
            f"✅ *License Key Berhasil Diaktifkan!*\n\n"
            f"📦 Paket: {plan.get('name', 'Unknown')}\n"
            f"🏷️ Tipe: {plan.get('type', 'Unknown')}\n"
            f"⏰ Berlaku sampai: {expires}\n\n"
            f"Selamat menikmati fitur premium! 🎉",
            parse_mode="Markdown"
        )
    else:
        error_msg = result.get("error", "Terjadi kesalahan tidak dikenal")
        await update.message.reply_text(
            f"❌ *Gagal Mengaktifkan Key*\n\n"
            f"Alasan: {error_msg}\n\n"
            f"Pastikan key yang dimasukkan benar dan belum pernah digunakan.",
            parse_mode="Markdown"
        )

async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler untuk /status - Cek status membership user."""
    user = update.effective_user
    
    # Kita cek dari sisi key yang pernah di-activate user ini
    # Untuk saat ini, arahkan user untuk cek manual
    await update.message.reply_text(
        f"ℹ️ *Status Membership*\n\n"
        f"User: @{user.username or user.first_name}\n"
        f"Telegram ID: `{user.id}`\n\n"
        f"Untuk verifikasi key tertentu, gunakan:\n"
        f"`/check KC-XXXX-XXXX-XXXX`",
        parse_mode="Markdown"
    )

async def check(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler untuk /check <key> - Cek status license key."""
    if not context.args:
        await update.message.reply_text(
            "⚠️ Format: `/check KC-XXXX-XXXX-XXXX`",
            parse_mode="Markdown"
        )
        return
    
    key = context.args[0].upper()
    
    result = krypton_request("GET", "/api/verify-key", params={"key": key})
    
    if result.get("valid"):
        plan = result.get("plan", {})
        await update.message.reply_text(
            f"✅ *Key Valid & Aktif*\n\n"
            f"📦 Paket: {plan.get('name', 'Unknown')}\n"
            f"🏷️ Tipe: {plan.get('type', 'Unknown')}\n"
            f"⏰ Expired: {result.get('expires_at') or 'Lifetime'}",
            parse_mode="Markdown"
        )
    else:
        status_text = result.get("status", "unknown")
        await update.message.reply_text(
            f"❌ *Key Tidak Aktif*\n\n"
            f"Status: {status_text}\n"
            f"Error: {result.get('error', 'N/A')}",
            parse_mode="Markdown"
        )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler untuk /help."""
    await update.message.reply_text(
        "📖 *Panduan Bot Kryptoncode*\n\n"
        "*Perintah:*\n"
        "/start — Mulai bot\n"
        "/activate `<key>` — Aktivasi license key\n"
        "/check `<key>` — Cek status license key\n"
        "/status — Info akun Anda\n"
        "/help — Tampilkan bantuan ini\n\n"
        "*Cara Mendapatkan License Key:*\n"
        "1. Kunjungi website Kryptoncode\n"
        "2. Pilih paket (VIP Global atau Per-Bot)\n"
        "3. Bayar dengan USDC di Base Network\n"
        "4. Copy license key yang diberikan\n"
        "5. Ketik /activate <key> di bot ini\n\n"
        "Butuh bantuan? Hubungi @kryptoncodes",
        parse_mode="Markdown"
    )

# ============================================================
# MAIN
# ============================================================
def main():
    if BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN":
        print("❌ ERROR: Isi BOT_TOKEN terlebih dahulu!")
        print("   Edit file ini atau set environment variable BOT_TOKEN")
        return
    
    if KRYPTON_API_KEY == "YOUR_KRYPTON_API_KEY":
        print("⚠️  WARNING: KRYPTON_API_KEY belum diatur.")
        print("   Bot akan berjalan tapi tidak bisa verifikasi license key.")
        print("   Generate API key dari dashboard Supabase Anda.")
    
    print(f"🤖 Starting Kryptoncode Bot...")
    print(f"   API URL: {KRYPTON_API_URL}")
    
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("activate", activate))
    app.add_handler(CommandHandler("check", check))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("help", help_cmd))
    
    print("✅ Bot is running! Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
