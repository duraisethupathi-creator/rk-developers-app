# RK Developers Gemini Scanner Backend (Cloud Run)

This backend is separate from the Android app and does not require Vercel. It accepts `POST /scan` multipart/form-data with a field named `image`, and returns structured JSON. `GET /health` is public.

## Deploy with Google Cloud Shell (customer-owned Google Cloud project)

1. Open https://console.cloud.google.com/ and select the **customer's** project. Enable billing if required. Open Cloud Shell.
2. Clone the repo: `git clone https://github.com/duraisethupathi-creator/rk-developers-app.git && cd rk-developers-app/backend`
3. Enable services: `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com`
4. Create two secrets using Cloud Console > Security > Secret Manager: `rk-gemini-api-key` (customer's Gemini API key) and `rk-scanner-access-token` (long random app access token). Never put these values in GitHub or chat.
5. Deploy (choose your region/project):
```sh
gcloud run deploy rk-developers-ai-scanner --source . --region asia-south1 --allow-unauthenticated --set-secrets GEMINI_API_KEY=rk-gemini-api-key:latest,SCANNER_ACCESS_TOKEN=rk-scanner-access-token:latest --set-env-vars GEMINI_MODEL=gemini-2.5-flash
``
6. Grant the Cloud Run runtime service account Secret Manager Secret Accessor on the two secrets, if deployment reports permission errors. This service is publicly reachable but every `POST /scan` requires a matching bearer access token. For production, add user authentication, rate limiting, budget alerts and monitoring.
7. In the Android app > More > Settings, set **AI Scanner HTTPS Endpoint** to the Cloud Run service URL plus `/scan`; enter the access token in **AI Scanner Access Token**. Save both.
8. Scan an actual handwritten sheet. Verify all values before saving.

This deployment stores the customer's Gemini key on their own Cloud project, not in the APK. Cloud Run and Gemini may incur charges. A shared token is suitable for an initial single-customer demo, **not multi-tenant customer authentication**. Do not share this endpoint/token publicly. Uploaded photos are processed in memory and forwarded to Gemini, not saved to disk by this code. See Google's data handling terms for Gemini API.
