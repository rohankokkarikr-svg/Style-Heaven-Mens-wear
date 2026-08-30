# Twilio WhatsApp Notification Setup Guide

This backend uses **Twilio for WhatsApp** to automatically dispatch real-time order confirmation, UPI verification, edit, and cancellation messages to both Admin and Customers.

---

## 1. Get Twilio Credentials

1. Sign up or log in to [Twilio Console](https://console.twilio.com/).
2. On your Twilio Dashboard, find and copy:
   - **Account SID** (e.g. `ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
   - **Auth Token** (e.g. `your_auth_token_here`)
3. Navigate to **Messaging > Try it out > Send a WhatsApp message** to activate the **Twilio Sandbox for WhatsApp**.
4. Note your Twilio Sandbox phone number (default: `whatsapp:+14155238886`).

---

## 2. Configure Backend `.env`

Add your Twilio credentials to `backend/.env`:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_FROM=+14155238886
```

*(Note: `TWILIO_WHATSAPP_FROM` can be entered as `+14155238886` or `whatsapp:+14155238886`.)*

---

## 3. Join the Sandbox (For Twilio Sandbox Mode)

If using the free Twilio Sandbox:
1. Have the Admin and recipient send the sandbox join code (e.g. `join <your-sandbox-keyword>`) to **+1 415 523 8886** on WhatsApp.
2. Once connected, all order placed, updated, payment verified, and cancelled events will immediately send WhatsApp notifications via Twilio.
