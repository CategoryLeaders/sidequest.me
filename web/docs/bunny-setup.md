# Bunny.net Setup Guide — SideQuest.me Photowall

## 1. Create a Bunny.net Account

Go to [bunny.net](https://bunny.net) and sign up. 14-day free trial, no credit card required.

## 2. Create a Storage Zone

1. Dashboard → **Storage** → **Add Storage Zone**
2. Name: `sidequest-photos`
3. Main region: **EU (Falkenstein)** — or London if available
4. Tier: Standard (cheaper, fine for photos)
5. Click **Add Storage Zone**
6. **Copy the API key** from the storage zone's **FTP & API Access** page — you'll need this for uploads

## 3. Create a Pull Zone (CDN)

1. Dashboard → **CDN** → **Add Pull Zone**
2. Name: `sidequest-photos`
3. Origin type: **Storage Zone** → select `sidequest-photos`
4. Pricing tiers: tick **Europe & North America** (cheapest, covers your audience)
5. Click **Add Pull Zone**

Your CDN URL will be: `https://sidequest-photos.b-cdn.net`

## 4. Set Up Custom Subdomain (images.sidequest.me)

### In Bunny.net:
1. Go to your pull zone → **Hostnames**
2. Click **Add Hostname**
3. Enter: `images.sidequest.me`
4. Enable **Free SSL Certificate**

### In your DNS provider (wherever sidequest.me is managed):
Add a CNAME record:

```
Type:  CNAME
Name:  images
Value: sidequest-photos.b-cdn.net
TTL:   3600
```

Wait a few minutes for DNS propagation, then click **Force SSL** in the Bunny hostname settings.

## 5. Upload Your Photos

### Set environment variables:
```bash
export BUNNY_STORAGE_ZONE="sidequest-photos"
export BUNNY_API_KEY="your-storage-api-key-from-step-2"
export BUNNY_STORAGE_REGION=""   # empty = default EU region
```

### Run the upload script:
```bash
cd ~/path/to/Sidequest.me
./scripts/upload-to-bunny.sh
```

This uploads all 1,282 images (213MB) in parallel. Takes roughly 2-5 minutes on a decent connection.

### Verify uploads:
- Check the Bunny dashboard: Storage → `sidequest-photos` → `photowall/`
- Test a URL: `https://images.sidequest.me/photowall/17886292656384976.jpg`

## 6. Configure Vercel

Add the environment variable in Vercel so the site uses the CDN:

1. Go to [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Add:
   - Key: `NEXT_PUBLIC_CDN_URL`
   - Value: `https://images.sidequest.me`
   - Environments: Production, Preview, Development
3. **Redeploy** the site (Settings → Deployments → redeploy latest)

## 7. Local Development

For local dev, you have two options:

**Option A — Use the CDN (easiest):**
Create a `.env.local` file:
```
NEXT_PUBLIC_CDN_URL=https://images.sidequest.me
```

**Option B — Use local images:**
Don't set `NEXT_PUBLIC_CDN_URL` and keep images in `public/photowall/`. The code falls back to local paths automatically.

## 8. Enable Bunny Optimizer (Optional)

Bunny offers automatic image optimisation (WebP/AVIF conversion, resizing):

1. Pull zone → **Optimizer** → Enable
2. Toggle: **WebP Compression**, **AVIF Compression**
3. This costs $9.50/month but auto-converts all images to the smallest format the browser supports

For a personal site this probably isn't worth it — your images are already a reasonable size.

---

## Monthly Cost Estimate

| Item | Cost |
|------|------|
| Storage (0.21 GB) | ~$0.01 |
| Bandwidth (light traffic) | ~$0.10 |
| **Total** | **~$0.11/month** |

Bunny has a $1/month minimum charge.

## Files Changed

| File | What changed |
|------|-------------|
| `src/lib/cdn.ts` | New — CDN URL helper function |
| `src/app/photowall/page.tsx` | Uses `photowallUrl()` instead of hardcoded paths |
| `src/app/page.tsx` | Same — homepage photo reference |
| `next.config.ts` | Added `images.remotePatterns` for Bunny/custom domain |
| `scripts/upload-to-bunny.sh` | New — bulk upload script |
