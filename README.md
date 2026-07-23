# Zonk Roblox Script Showcase

A responsive Roblox script showcase that renders script cards and loads live game titles, icons, and thumbnails from Roblox APIs.

## Local checks

```bash
npm run check
```

For a Vercel-like local API environment, run:

```bash
npx vercel dev
```

## Vercel deployment note

If the deployed site or `/api/roblox?placeId=14713532223` redirects to a Vercel SSO URL such as `/sso-api`, the project is protected by Vercel Deployment Protection. In that state, visitors and frontend metadata requests cannot reach the app/API anonymously, so cards will not be able to load Roblox thumbnails, icons, or game names.

To make the public showcase work:

1. Open the project in Vercel.
2. Go to **Settings → Deployment Protection**.
3. Disable protection for the deployment/environment you want to share publicly, or use a public production domain that is not behind Vercel SSO.
4. Redeploy and test both:
   - `/`
   - `/api/roblox?placeId=14713532223`

The API route itself only calls Roblox-owned API domains and normalizes those responses for the frontend.
