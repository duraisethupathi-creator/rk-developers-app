# RK Developers AI Scanner — Cloudflare Workers Free

Cloudflare Workers alternative to Google Cloud Run. No Google Cloud Billing or Secret Manager needed. The customer's Gemini API key is stored in Cloudflare Worker **Secrets**, never in GitHub or Android APK.

## Deploy from Cloudflare dashboard (no laptop required)
1. Create/sign into the customer's Cloudflare account: https://dash.cloudflare.com/
2. Workers & Pages → Create application → Connect GitHub repository.
3. Select `duraisethupathi-creator/rk-developers-app` (authorize only this repo where possible).
4. Set **Root directory** to `cloudflare-worker`, **Worker name** to `rk-developers-ai-scanner`, **Deploy command** to `npx wrangler deploy` if requested. Deploy.
5. Open the Worker → Settings → Variables and Secrets → Add → Type **Secret**:
   - `GEMINI_API_KEY`: customer's Gemini API key.
   - `SCANNER_ACCESS_TOKEN`: strong random 32+ character access token, unique for this customer.
   Save/deploy secrets. Never paste either secret into GitHub or chat.
6. Visit `https://rk-developers-ai-scanner.<your-subdomain>.workers.dev/health`. Expected JSON: `{"status":"ok",...}`.
7. Android App → More → Settings → **AI Scanner HTTPS Endpoint**: `https://rk-developers-ai-scanner.<your-subdomain>.workers.dev/scan`. Enter **AI Scanner Access Token** (not Gemini key). Save.
8. Open Scan, select a handwritten sheet, tap **AI Vision Scan (Online)**, review/correct the extracted values and Apply to Payment Form.

**Important:** A single shared bearer token stored in the Android app is for a single-customer prototype only. For production/multiple customers use authentication, rate limits and device-secure credential storage. The Worker itself does not persist images, but forwards them to Gemini for processing. Gemini usage is separately metered and may incur charges. Workers Free has CPU/request limits; test real images. Keep uploaded images under 8MB. The old `backend/` Cloud Run implementation remains as an alternative and is not used by this Worker.

If Git integration is unavailable, use a laptop with `cd cloudflare-worker && npm install && npx wrangler login && npx wrangler deploy`. Configure secrets using `npx wrangler secret put GEMINI_API_KEY` and `npx wrangler secret put SCANNER_ACCESS_TOKEN`.
