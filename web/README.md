# sidequest.me

Sophie Collins' personal homepage — a neo-brutalist, sticker-collage-style site built with Next.js, Tailwind CSS, and Notion as a CMS.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, latest cards, scrolling ticker, quick thoughts |
| About | `/about` | Tabbed panels — Bio, Professional, Loves & Hates |
| Photos | `/photos` | Filterable photo gallery (London / Travel / Food) |
| Ideas | `/ideas` | Articles & thoughts, powered by Notion CMS |
| Projects | `/projects` | Active side projects & ventures |

## Connecting Notion (Ideas Page)

The Ideas page pulls content from a Notion database. Without it, the page shows placeholder content — so the site works fine without Notion connected.

### Step 1: Create a Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Name it something like "sidequest.me"
4. Select your workspace
5. Click **Submit** → copy the **Internal Integration Secret**

### Step 2: Create the Database

Create a new **full-page database** in Notion with these properties:

| Property | Type | Notes |
|----------|------|-------|
| Title | Title | The main title column (default) |
| Type | Select | Options: `Article`, `Thought` |
| Description | Rich text | Short description for articles |
| Text | Rich text | Full text for short thoughts |
| Date | Date | Publication date |
| Tags | Multi-select | e.g. `Building`, `Product`, `Notion`, `Dev` |
| Published | Checkbox | Only checked items appear on the site |

### Step 3: Share with Integration

1. Open your database page in Notion
2. Click **···** (top right) → **Connections** → find your integration → **Confirm**

### Step 4: Get the Data Source ID

The database URL looks like:
```
https://www.notion.so/your-workspace/abc123def456...?v=...
```
The `abc123def456...` part (32 hex characters) is your data source ID.

### Step 5: Add Environment Variables

Create a `.env.local` file in the project root:

```env
NOTION_API_KEY=ntn_xxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=abc123def456789...
```

Restart the dev server and the Ideas page will pull from your Notion database.

## Deploy to Vercel

1. Push the project to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add the environment variables (`NOTION_API_KEY`, `NOTION_DATABASE_ID`) in the Vercel dashboard
4. Click **Deploy**

Your site will be live. Connect a custom domain (like sidequest.me) in the Vercel dashboard under **Settings → Domains**.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **CMS**: Notion API (`@notionhq/client` v5)
- **Fonts**: Archivo (headings), DM Sans (body), Space Mono (accents)
- **Hosting**: Vercel (recommended)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts & metadata
│   ├── globals.css         # Design tokens & component styles
│   ├── page.tsx            # Home page
│   ├── about/page.tsx      # About (tabbed)
│   ├── photos/page.tsx     # Photo gallery
│   ├── ideas/page.tsx      # Ideas & Thoughts (Notion CMS)
│   └── projects/page.tsx   # Projects
├── components/
│   ├── Nav.tsx             # Sticky navigation
│   └── Footer.tsx          # Site footer
└── lib/
    └── notion.ts           # Notion API client
```

## Customising

- **Colours**: Edit the CSS custom properties in `globals.css` (lines 3-12)
- **Content**: Most page content is defined as data arrays at the top of each page file
- **Photos**: Replace the coloured placeholder `<div>`s with `<Image>` components and real photos
- **Social links**: Update URLs in `Footer.tsx`
