# Fetch Real Company Logos

Paste this entire prompt into Claude Code from the `/Users/sophie/Sidequests/Sidequest.me` directory.

---

## Prompt

I need you to download the REAL official logos for my career page and save them as SVGs in `public/logos/`. Do NOT recreate or approximate any logos — only use the actual brand assets.

### Companies and what I need:

1. **Hack The Box** → `public/logos/hackthebox.svg`
   - Already done (real Simple Icons SVG is in place)
   - Brand colour in career-data.ts: `#9FEF00` ✓ confirmed correct

2. **1E** → `public/logos/1e.svg`
   - Enterprise software company (endpoint management/DEX). Rebranded Sept 2022.
   - Website: https://www.1e.com
   - Brand colour in career-data.ts: `#F7941D` (orange) — verify this is correct
   - Try: download from their website favicon/assets, or brandfetch.com, or seeklogo.com

3. **Signal AI** (listed as "Signal Media" in my data) → `public/logos/signalmedia.svg`
   - AI media intelligence company. Rebranded 2024 with Wunderdogs agency. Searchlight-inspired logo.
   - Website: https://www.signal-ai.com
   - NOT Signal Messenger — do not use the Signal Messenger logo
   - Brand colour in career-data.ts: `#0066FF` — verify this is correct
   - Try: download from their website, or brandfetch.com, or seeklogo.com

4. **Brandwatch** → `public/logos/brandwatch.svg`
   - Social media analytics company (now part of Cision).
   - Website: https://www.brandwatch.com
   - Known brand colours: #5FC3E6 (Miami Blue), #9C7CB6 (Deep Lavender), #F46B00 (Lava Orange)
   - Brand colour in career-data.ts: `#FF6B35` — this might be wrong, check and update if needed
   - Try: download from their website, or brandfetch.com, or seeklogo.com

5. **Self-Employed** → `public/logos/self-employed.svg`
   - This is not a real company. Use a simple, clean briefcase or freelancer icon from an open-source icon set (Lucide, Heroicons, or similar). Keep it minimal and on-brand with our neo-brutalist design.
   - Brand colour: `#c4a8ff` (purple)

6. **Earlier Career** → `public/logos/earlier-career.svg`
   - This is not a real company. Use a simple, clean rocket or seedling icon from an open-source icon set (Lucide, Heroicons, or similar). Keep it minimal.
   - Brand colour: `#888888` (grey)

### Requirements:
- All logos must be real official brand assets (except Self-Employed and Earlier Career which need generic icons)
- Save as SVG files in `public/logos/`
- If any brand colours in `src/lib/career-data.ts` are wrong, update them to the correct official values
- After saving logos, run `npm run build` to verify nothing breaks
- Then run `vercel deploy --prod --yes` to deploy

### Approach for downloading logos:
- Try company websites first (look in page source for SVG logos, or check `/favicon.svg`, press kits, brand pages)
- Try https://brandfetch.com/[company] 
- Try https://seeklogo.com search
- Try https://worldvectorlogo.com search
- Use `curl` or `wget` to download
- For SVGs embedded in HTML, extract the SVG markup

### File references:
- Logo paths defined in: `src/lib/career-data.ts`
- Logos served from: `public/logos/`
- Current logo filenames: `hackthebox.svg`, `1e.svg`, `signalmedia.svg`, `brandwatch.svg`, `self-employed.svg`, `earlier-career.svg`
