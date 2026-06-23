# WhatsApp Notification Setup Guide

This guide explains how to set up Twilio WhatsApp notifications for order updates.

## 1. Get Twilio Credentials

1. Sign up or log in to [Twilio](https://www.twilio.com/).
2. From the Console Dashboard, copy your **Account SID** and **Auth Token**.
3. Go to the **Messaging > Try it out > Send a WhatsApp message** section to set up the **Twilio Sandbox for WhatsApp**.
4. Note down the sandbox number (e.g. `+14155238886`).

## 2. Update Environment Variables

Add the following to your backend `.env` file (these have been added for you as placeholders):

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=your_twilio_sandbox_whatsapp_number
```

Replace `your_twilio_sid`, `your_twilio_auth_token`, and `your_twilio_sandbox_whatsapp_number` with your actual Twilio details.

## 3. Register Recipient (Admin)

If you are using the Twilio Sandbox:
1. The admin phone number must join the sandbox first. Send the sandbox join keyword (e.g. `join <sandbox-keyword>`) from the admin's WhatsApp number to the Twilio WhatsApp sandbox number.
2. Ensure the admin's phone number is configured correctly in `backend/data/site_settings.json` or defaults to your chosen number in [whatsapp.js](file:///c:/Users/ROHAN/Desktop/Style%20Heaven%20mens%20wear/backend/utils/whatsapp.js).
