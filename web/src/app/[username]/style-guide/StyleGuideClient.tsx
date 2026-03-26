/* ── StyleGuideClient — interactive style guide with all sections ── */
"use client";

import { useState } from "react";
import { CardShell } from "@/components/ui/CardShell";
import { CardFooter } from "@/components/ui/CardFooter";
import { TagChip } from "@/components/ui/TagChip";
import { TypeBadge } from "@/components/ui/TypeBadge";
import type { ContentType } from "@/components/ui/TypeBadge";
import { ProjectBadge } from "@/components/ui/ProjectBadge";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ImageGrid } from "@/components/ui/ImageGrid";
import { EngagementBar } from "@/components/ui/EngagementBar";
import { MetadataLine } from "@/components/ui/MetadataLine";

interface Props {
  username: string;
}

/* ── Section wrapper ── */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

/* ── Subsection ── */
function Sub({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="font-head font-bold text-[var(--text-lg)] uppercase mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Swatch grid item ── */
function Swatch({
  name,
  cssVar,
  textClass,
}: {
  name: string;
  cssVar: string;
  textClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 border-2 border-ink flex-shrink-0"
        style={{ background: `var(${cssVar})` }}
      />
      <div>
        <div className={`font-mono text-[var(--text-sm)] font-bold ${textClass ?? ""}`}>
          {name}
        </div>
        <div className="font-mono text-[var(--text-xs)] opacity-40">
          var({cssVar})
        </div>
      </div>
    </div>
  );
}

/* ── Token demo row ── */
function TokenRow({
  label,
  value,
  demo,
}: {
  label: string;
  value: string;
  demo: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-ink/[0.06]">
      <code className="font-mono text-[var(--text-xs)] opacity-50 w-32 flex-shrink-0">
        {label}
      </code>
      <code className="font-mono text-[var(--text-xs)] opacity-30 w-20 flex-shrink-0">
        {value}
      </code>
      <div className="flex-1">{demo}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export function StyleGuideClient({ username }: Props) {
  const [activeNav, setActiveNav] = useState("foundations");

  const navItems = [
    { id: "foundations", label: "Foundations" },
    { id: "components", label: "Components" },
    { id: "cards", label: "Card Types" },
    { id: "hierarchy", label: "Hierarchy" },
    { id: "images", label: "Images" },
    { id: "layouts", label: "Layouts" },
    { id: "dosdonts", label: "Do's & Don'ts" },
  ];

  return (
    <div>
      {/* ── Sticky nav ── */}
      <nav className="flex flex-wrap gap-2 mb-10 sticky top-0 z-40 bg-[var(--bg)] py-3 border-b-3 border-ink">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setActiveNav(item.id)}
            className={`sticker text-[var(--text-xs)] !px-3 !py-1 !border-2 no-underline ${
              activeNav === item.id
                ? "sticker-orange"
                : "hover:bg-ink/[0.06]"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* ═══════════ 1. DESIGN FOUNDATIONS ═══════════ */}
      <Section id="foundations" title="Design Foundations">
        {/* Colors */}
        <Sub title="Color Palette">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            6 accent colors + 3 ink levels + 2 background levels. Each color has a
            &ldquo;on-&rdquo; contrast pair for text on that color.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Swatch name="Orange" cssVar="--orange" />
            <Swatch name="Green" cssVar="--green" />
            <Swatch name="Pink" cssVar="--pink" />
            <Swatch name="Blue" cssVar="--blue" />
            <Swatch name="Yellow" cssVar="--yellow" />
            <Swatch name="Lilac" cssVar="--lilac" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Swatch name="Ink" cssVar="--ink" />
            <Swatch name="Ink Secondary" cssVar="--ink-secondary" />
            <Swatch name="Ink Muted" cssVar="--ink-muted" />
            <Swatch name="Background" cssVar="--bg" />
            <Swatch name="Card Background" cssVar="--bg-card" />
            <Swatch name="Cream" cssVar="--cream" />
          </div>
        </Sub>

        {/* Typography */}
        <Sub title="Typography Scale">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            8-step scale replacing 15+ ad-hoc font sizes. Use token names, not raw rem values.
          </p>
          <div className="space-y-0">
            <TokenRow
              label="--text-2xs"
              value="0.55rem"
              demo={
                <span style={{ fontSize: "var(--text-2xs)" }} className="font-head font-bold uppercase">
                  Type badges, sticker labels
                </span>
              }
            />
            <TokenRow
              label="--text-xs"
              value="0.6rem"
              demo={
                <span style={{ fontSize: "var(--text-xs)" }} className="font-mono">
                  Timestamps, tag chips, metadata
                </span>
              }
            />
            <TokenRow
              label="--text-sm"
              value="0.78rem"
              demo={
                <span style={{ fontSize: "var(--text-sm)" }}>
                  Metadata, captions, secondary text
                </span>
              }
            />
            <TokenRow
              label="--text-base"
              value="0.92rem"
              demo={
                <span style={{ fontSize: "var(--text-base)" }}>
                  Body text, card content — the default reading size
                </span>
              }
            />
            <TokenRow
              label="--text-md"
              value="1.05rem"
              demo={
                <span style={{ fontSize: "var(--text-md)" }} className="font-medium italic">
                  Quote text, emphasis, slightly larger body
                </span>
              }
            />
            <TokenRow
              label="--text-lg"
              value="1.1rem"
              demo={
                <span style={{ fontSize: "var(--text-lg)" }} className="font-head font-bold uppercase">
                  Card titles, section titles
                </span>
              }
            />
            <TokenRow
              label="--text-xl"
              value="1.3rem"
              demo={
                <span style={{ fontSize: "var(--text-xl)" }} className="font-head font-[900] uppercase">
                  Section headings
                </span>
              }
            />
            <TokenRow
              label="--text-2xl"
              value="1.6rem"
              demo={
                <span style={{ fontSize: "var(--text-2xl)" }} className="font-head font-[900] uppercase">
                  Page headings
                </span>
              }
            />
          </div>
        </Sub>

        {/* Fonts */}
        <Sub title="Font Families">
          <div className="space-y-4">
            <div>
              <p className="font-head font-[900] text-[var(--text-lg)] uppercase mb-1">
                Archivo — Headings &amp; Labels
              </p>
              <p className="font-mono text-[var(--text-xs)] opacity-40">
                var(--font-head) &middot; Weights: 400, 700, 900 &middot; Used: titles, stickers, badges, nav
              </p>
            </div>
            <div>
              <p className="text-[var(--text-lg)] mb-1">
                DM Sans — Body Text
              </p>
              <p className="font-mono text-[var(--text-xs)] opacity-40">
                var(--font-body) &middot; Weights: 400, 500, 700 &middot; Used: paragraphs, descriptions, forms
              </p>
            </div>
            <div>
              <p className="font-mono text-[var(--text-lg)] mb-1">
                Space Mono — Code &amp; Metadata
              </p>
              <p className="font-mono text-[var(--text-xs)] opacity-40">
                var(--font-mono) &middot; Weights: 400, 700 &middot; Used: timestamps, tags, technical labels
              </p>
            </div>
          </div>
        </Sub>

        {/* Spacing */}
        <Sub title="Card Spacing">
          <div className="flex gap-6 flex-wrap">
            <div className="border-3 border-ink bg-[var(--bg-card)] p-[var(--space-card-standard)]">
              <div className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                --space-card-standard: 1.25rem (20px)
              </div>
              <div className="text-[var(--text-sm)]">
                Primary cards — microblogs, quotes, bookmarks, etc.
              </div>
            </div>
            <div className="border-3 border-ink/[0.15] bg-[var(--bg-card)] p-[var(--space-card-compact)]">
              <div className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                --space-card-compact: 1rem (16px)
              </div>
              <div className="text-[var(--text-sm)]">
                Nested/secondary cards — adventure posts, compact items
              </div>
            </div>
          </div>
        </Sub>

        {/* Opacity */}
        <Sub title="Opacity Scale">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            4 semantic steps replacing 8+ ad-hoc opacity values. Use these for border-ink/[val] and bg-ink/[val].
          </p>
          <div className="space-y-3">
            {[
              { name: "faint", val: "0.03", use: "Background tints" },
              { name: "subtle", val: "0.06", use: "Hover states, light fills" },
              { name: "muted", val: "0.15", use: "Secondary borders, dividers, card footer borders" },
              { name: "dim", val: "0.30", use: "Prominent secondary borders, link previews" },
            ].map((o) => (
              <div key={o.name} className="flex items-center gap-4">
                <div
                  className="w-24 h-10 border-2 border-ink"
                  style={{ background: `rgba(0,0,0,${o.val})` }}
                />
                <div>
                  <code className="font-mono text-[var(--text-xs)] font-bold">
                    --opacity-{o.name}: {o.val}
                  </code>
                  <div className="font-mono text-[var(--text-xs)] opacity-40">
                    {o.use}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Sub>

        {/* Borders */}
        <Sub title="Border Weights">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-32 h-0 border-t-[3px] border-ink" />
              <code className="font-mono text-[var(--text-xs)]">
                3px — Card borders (primary)
              </code>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-0 border-t-2 border-ink" />
              <code className="font-mono text-[var(--text-xs)]">
                2px — Inner elements, sticker borders, image borders
              </code>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-0 border-t border-ink/[0.15]" />
              <code className="font-mono text-[var(--text-xs)]">
                1px — Footer dividers, separators
              </code>
            </div>
          </div>
        </Sub>
      </Section>

      {/* ═══════════ 2. COMPONENT SHOWCASE ═══════════ */}
      <Section id="components" title="Component Library">
        {/* CardShell */}
        <Sub title="CardShell">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Base wrapper for all card content. Three variants + optional rotation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardShell variant="standard">
              <div className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                variant=&quot;standard&quot;
              </div>
              <p className="text-[var(--text-sm)]">
                Primary cards. 3px solid border, standard padding. Used for microblogs, quotes, bookmarks, etc.
              </p>
            </CardShell>
            <CardShell variant="compact">
              <div className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                variant=&quot;compact&quot;
              </div>
              <p className="text-[var(--text-sm)]">
                Nested/secondary. Muted border (15% opacity), compact padding.
              </p>
            </CardShell>
            <CardShell variant="interactive">
              <div className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                variant=&quot;interactive&quot;
              </div>
              <p className="text-[var(--text-sm)]">
                Clickable cards. Adds hover lift + shadow. Used for project/adventure grids.
              </p>
            </CardShell>
          </div>
          <div className="mt-6">
            <p className="font-mono text-[var(--text-xs)] opacity-40 mb-3">
              With rotation prop:
            </p>
            <div className="flex gap-6 flex-wrap">
              {[-1.5, -0.5, 0.5, 1.5, 2].map((r) => (
                <CardShell key={r} variant="interactive" rotation={r}>
                  <div className="font-mono text-[var(--text-xs)] text-center py-2">
                    {r}&deg;
                  </div>
                </CardShell>
              ))}
            </div>
          </div>
        </Sub>

        {/* TypeBadge */}
        <Sub title="TypeBadge">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Content type indicator. Automatically maps type → color. Always uses sticker style.
          </p>
          <div className="flex flex-wrap gap-3">
            {(
              ["microblog", "bookmark", "quote", "question", "writing", "adventure", "project"] as ContentType[]
            ).map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </Sub>

        {/* TagChip */}
        <Sub title="TagChip">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Unified tag system replacing 3 separate implementations. Three variants.
          </p>
          <div className="space-y-4">
            <div>
              <p className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                variant=&quot;default&quot; — thoughts stream, card tags
              </p>
              <div className="flex flex-wrap gap-2">
                <TagChip label="javascript" variant="default" />
                <TagChip label="react" variant="default" />
                <TagChip label="design" variant="default" active />
                <TagChip label="ux" variant="default" href={`/${username}/thoughts/tags/ux`} />
              </div>
            </div>
            <div>
              <p className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                variant=&quot;sticker&quot; — filter tabs, category labels
              </p>
              <div className="flex flex-wrap gap-2">
                <TagChip label="All" variant="sticker" active />
                <TagChip label="Tech" variant="sticker" color="orange" />
                <TagChip label="Design" variant="sticker" color="pink" />
                <TagChip label="Travel" variant="sticker" color="green" />
                <TagChip label="Ideas" variant="sticker" color="lilac" />
              </div>
            </div>
            <div>
              <p className="font-mono text-[var(--text-xs)] opacity-40 mb-2">
                variant=&quot;muted&quot; — professional page, conservative contexts
              </p>
              <div className="flex flex-wrap gap-2">
                <TagChip label="Product" variant="muted" />
                <TagChip label="Strategy" variant="muted" />
                <TagChip label="Leadership" variant="muted" />
              </div>
            </div>
          </div>
        </Sub>

        {/* ProjectBadge */}
        <Sub title="ProjectBadge">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Shows project association on cards. Auto-hides on the project&apos;s own page.
          </p>
          <div className="flex flex-wrap gap-4">
            <ProjectBadge
              project={{ slug: "sidequest-me", name: "SideQuest.me", status: "active" }}
              username={username}
            />
            <ProjectBadge
              project={{ slug: "category-leaders", name: "Category Leaders", status: "paused" }}
              username={username}
            />
            <ProjectBadge
              project={{ slug: "old-project", name: "Archived Thing", status: "complete" }}
              username={username}
            />
          </div>
        </Sub>

        {/* ActionMenu */}
        <Sub title="ActionMenu">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Owner-only overflow menu. Delete has confirmation step. Place top-right of cards.
          </p>
          <div className="flex gap-6 items-start">
            <CardShell variant="standard" className="w-64">
              <div className="flex justify-between items-start">
                <TypeBadge type="microblog" />
                <ActionMenu
                  onEdit={() => alert("Edit")}
                  onDelete={() => alert("Delete")}
                  onShare={() => alert("Share")}
                  onPin={() => alert("Pin")}
                />
              </div>
              <p className="text-[var(--text-sm)] mt-3">
                Card with all actions available. Click &ldquo;&middot;&middot;&middot;&rdquo; to see menu.
              </p>
            </CardShell>
            <CardShell variant="standard" className="w-64">
              <div className="flex justify-between items-start">
                <TypeBadge type="quote" />
                <ActionMenu onShare={() => alert("Share")} />
              </div>
              <p className="text-[var(--text-sm)] mt-3">
                Card with share only (visitor view).
              </p>
            </CardShell>
          </div>
        </Sub>

        {/* EngagementBar */}
        <Sub title="EngagementBar + CardFooter">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Unified footer: timestamp left, engagement right. All card types get this.
          </p>
          <CardShell variant="standard" className="max-w-lg">
            <TypeBadge type="microblog" />
            <p className="text-[var(--text-base)] mt-3 mb-3">
              Example post showing the unified footer with reactions, comments, and share.
            </p>
            <CardFooter
              left={
                <span className="text-[var(--text-xs)] font-mono opacity-40">
                  2 hours ago
                </span>
              }
              right={
                <EngagementBar
                  reactions={[
                    { emoji: "❤️", count: 5 },
                    { emoji: "🔥", count: 3 },
                    { emoji: "👍", count: 1 },
                  ]}
                  commentCount={4}
                  commentHref="#"
                  shareUrl={`/${username}/thoughts/abc123`}
                />
              }
            />
          </CardShell>
        </Sub>

        {/* MetadataLine */}
        <Sub title="MetadataLine">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Consistent metadata display for word count, read time, location, etc.
          </p>
          <div className="space-y-3">
            <MetadataLine
              items={[
                { icon: "📍", label: "London, UK" },
                { icon: "📅", label: "Mar 2026" },
              ]}
            />
            <MetadataLine
              items={[
                { label: "1,240 words" },
                { label: "5 min read" },
                { icon: "🏷️", label: "3 tags" },
              ]}
            />
          </div>
        </Sub>

        {/* ImageGrid */}
        <Sub title="ImageGrid + Lightbox">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            Standardized image display. Click any image to zoom. Supports 1-N images with &quot;+N more&quot; overlay.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-[var(--text-xs)] opacity-40 mb-2">1 image</p>
              <ImageGrid
                images={[
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo" },
                ]}
              />
            </div>
            <div>
              <p className="font-mono text-[var(--text-xs)] opacity-40 mb-2">2 images</p>
              <ImageGrid
                images={[
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 1" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 2" },
                ]}
              />
            </div>
            <div>
              <p className="font-mono text-[var(--text-xs)] opacity-40 mb-2">4 images</p>
              <ImageGrid
                images={[
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 1" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 2" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 3" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 4" },
                ]}
              />
            </div>
            <div>
              <p className="font-mono text-[var(--text-xs)] opacity-40 mb-2">6 images (maxVisible=4)</p>
              <ImageGrid
                images={[
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 1" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 2" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 3" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 4" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 5" },
                  { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Demo 6" },
                ]}
                maxVisible={4}
              />
            </div>
          </div>
        </Sub>
      </Section>

      {/* ═══════════ 3. CARD TYPES ═══════════ */}
      <Section id="cards" title="Card Types — Proposed Unified Design">
        <p className="text-[var(--text-sm)] opacity-60 mb-6">
          Every card follows the same anatomy: <strong>Badge Row</strong> → <strong>Body</strong> →{" "}
          <strong>Media</strong> → <strong>Tags</strong> → <strong>Footer</strong>.
          Content types customize what appears in each zone, but the structure is shared.
        </p>

        {/* Card Anatomy */}
        <Sub title="Card Anatomy">
          <CardShell variant="standard" className="max-w-lg">
            <div className="space-y-3">
              {/* Zone 1: Badge Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="border-2 border-dashed border-orange/50 px-2 py-1">
                    <span className="font-mono text-[var(--text-2xs)] text-orange">
                      Zone 1: TYPE BADGE
                    </span>
                  </div>
                  <div className="border-2 border-dashed border-green/50 px-2 py-1">
                    <span className="font-mono text-[var(--text-2xs)] text-green">
                      PROJECT BADGE
                    </span>
                  </div>
                </div>
                <div className="border-2 border-dashed border-pink/50 px-2 py-1">
                  <span className="font-mono text-[var(--text-2xs)] text-pink">
                    ACTIONS
                  </span>
                </div>
              </div>

              {/* Zone 2: Body */}
              <div className="border-2 border-dashed border-blue/50 p-3">
                <span className="font-mono text-[var(--text-2xs)] text-blue block mb-1">
                  Zone 2: BODY
                </span>
                <span className="text-[var(--text-sm)] opacity-60">
                  Main content — text, quote, bookmark preview, etc.
                </span>
              </div>

              {/* Zone 3: Media */}
              <div className="border-2 border-dashed border-yellow/50 p-3">
                <span className="font-mono text-[var(--text-2xs)] text-yellow block mb-1">
                  Zone 3: MEDIA (optional)
                </span>
                <span className="text-[var(--text-sm)] opacity-60">
                  Images, link preview, embedded content
                </span>
              </div>

              {/* Zone 4: Tags */}
              <div className="border-2 border-dashed border-lilac/50 p-3">
                <span className="font-mono text-[var(--text-2xs)] text-lilac block mb-1">
                  Zone 4: TAGS (optional)
                </span>
                <span className="text-[var(--text-sm)] opacity-60">
                  Tag chips in &ldquo;default&rdquo; variant
                </span>
              </div>

              {/* Zone 5: Footer */}
              <div className="border-2 border-dashed border-ink/30 p-3">
                <span className="font-mono text-[var(--text-2xs)] block mb-1">
                  Zone 5: FOOTER
                </span>
                <span className="text-[var(--text-sm)] opacity-60">
                  Timestamp (left) + Engagement bar (right)
                </span>
              </div>
            </div>
          </CardShell>
        </Sub>

        {/* Example cards for each type */}
        <Sub title="Microblog Card">
          <CardShell variant="standard" className="max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TypeBadge type="microblog" />
                <ProjectBadge
                  project={{ slug: "sidequest-me", name: "SideQuest.me", status: "active" }}
                  username={username}
                />
              </div>
              <ActionMenu
                onEdit={() => {}}
                onDelete={() => {}}
                onShare={() => {}}
                onPin={() => {}}
              />
            </div>
            <p className="text-[var(--text-base)] leading-relaxed mb-3">
              Just shipped the new style guide for sidequest.me! Every card type now follows the same
              anatomy — badge row, body, media, tags, footer. Consistency without losing personality.
            </p>
            <ImageGrid
              images={[
                { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Screenshot" },
                { url: "https://images.sidequest.me/placeholder/600x400.jpg", alt: "Code" },
              ]}
              className="mb-3"
            />
            <div className="flex flex-wrap gap-1.5 mb-3">
              <TagChip label="design" href="#" />
              <TagChip label="ux" href="#" />
              <TagChip label="webdev" href="#" />
            </div>
            <CardFooter
              left={
                <span className="text-[var(--text-xs)] font-mono opacity-40">
                  2 hours ago
                </span>
              }
              right={
                <EngagementBar
                  reactions={[{ emoji: "❤️", count: 5 }, { emoji: "🔥", count: 2 }]}
                  commentCount={3}
                  commentHref="#"
                  shareUrl={`/${username}/thoughts/demo`}
                />
              }
            />
          </CardShell>
        </Sub>

        <Sub title="Quote Card">
          <CardShell variant="standard" className="max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <TypeBadge type="quote" />
              <ActionMenu onShare={() => {}} />
            </div>
            <div className="relative pl-6 mb-3">
              <span className="absolute left-0 top-0 text-[2.5rem] leading-none opacity-15 font-head font-[900]">
                &ldquo;
              </span>
              <blockquote className="text-[var(--text-md)] leading-relaxed font-medium italic">
                Design is not just what it looks like and feels like. Design is how it works.
              </blockquote>
            </div>
            <div className="mb-3 pl-6 text-[var(--text-sm)] opacity-60">
              <span className="font-bold">Steve Jobs</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <TagChip label="design" href="#" />
              <TagChip label="inspiration" href="#" />
            </div>
            <CardFooter
              left={
                <span className="text-[var(--text-xs)] font-mono opacity-40">
                  1 day ago
                </span>
              }
              right={
                <EngagementBar
                  reactions={[{ emoji: "💡", count: 8 }]}
                  shareUrl={`/${username}/thoughts/quote-demo`}
                />
              }
            />
          </CardShell>
        </Sub>

        <Sub title="Bookmark Card">
          <CardShell variant="standard" className="max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <TypeBadge type="bookmark" />
              <ActionMenu onShare={() => {}} />
            </div>
            <a
              href="#"
              className="block border-2 border-ink/[0.30] p-3 mb-3 bg-ink/[0.03] hover:bg-ink/[0.06] transition-colors no-underline"
            >
              <span className="text-[var(--text-xs)] font-mono opacity-40 block mb-1">
                example.com
              </span>
              <span className="text-[var(--text-sm)] font-bold block mb-0.5">
                The Future of Design Systems in 2026
              </span>
              <span className="text-[var(--text-sm)] opacity-60 block line-clamp-2">
                A comprehensive look at how design systems are evolving to handle multi-platform,
                multi-theme requirements while maintaining consistency.
              </span>
            </a>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <TagChip label="design-systems" href="#" />
              <TagChip label="reading" href="#" />
            </div>
            <CardFooter
              left={
                <span className="text-[var(--text-xs)] font-mono opacity-40">
                  3 days ago
                </span>
              }
              right={
                <EngagementBar shareUrl={`/${username}/thoughts/bookmark-demo`} />
              }
            />
          </CardShell>
        </Sub>

        <Sub title="Question Card">
          <CardShell variant="standard" className="max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TypeBadge type="question" />
                <span className="sticker sticker-green text-[var(--text-2xs)] !px-2 !py-0.5 !border-2">
                  Resolved
                </span>
              </div>
              <ActionMenu onShare={() => {}} />
            </div>
            <p className="text-[var(--text-base)] leading-relaxed mb-3 font-medium">
              What&apos;s the best approach for maintaining consistency across a design system with 6+ themes?
            </p>
            <div className="border-2 border-green/30 bg-green/[0.05] p-3 mb-3">
              <p className="text-[var(--text-sm)] opacity-70">
                Use design tokens as the foundation — semantic variables that map to different values per theme.
                Components reference tokens, never raw colors.
              </p>
            </div>
            <CardFooter
              left={
                <span className="text-[var(--text-xs)] font-mono opacity-40">
                  1 week ago
                </span>
              }
              right={
                <EngagementBar
                  commentCount={7}
                  commentHref="#"
                  shareUrl={`/${username}/thoughts/question-demo`}
                />
              }
            />
          </CardShell>
        </Sub>

        <Sub title="Writing Card">
          <CardShell variant="standard" className="max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TypeBadge type="writing" />
                <ProjectBadge
                  project={{ slug: "sidequest-me", name: "SideQuest.me", status: "active" }}
                  username={username}
                />
              </div>
              <ActionMenu onEdit={() => {}} onShare={() => {}} />
            </div>
            <h3 className="text-[var(--text-lg)] font-head font-bold mb-2">
              Building a Living Style Guide for Your Side Project
            </h3>
            <p className="text-[var(--text-base)] opacity-60 leading-relaxed mb-3 line-clamp-3">
              How I went from 8 inconsistent card components to a unified design system
              without rewriting everything. The key insight: codify what already works,
              then extract shared primitives.
            </p>
            <MetadataLine
              items={[
                { label: "2,400 words" },
                { label: "8 min read" },
              ]}
              className="mb-3"
            />
            <div className="flex flex-wrap gap-1.5 mb-3">
              <TagChip label="design" href="#" />
              <TagChip label="engineering" href="#" />
              <TagChip label="tutorial" href="#" />
            </div>
            <CardFooter
              left={
                <span className="text-[var(--text-xs)] font-mono opacity-40">
                  Published 2 days ago
                </span>
              }
              right={
                <EngagementBar
                  reactions={[{ emoji: "❤️", count: 12 }]}
                  commentCount={5}
                  commentHref="#"
                  shareUrl={`/${username}/writings/style-guide-demo`}
                />
              }
            />
          </CardShell>
        </Sub>
      </Section>

      {/* ═══════════ 4. INFORMATION HIERARCHY ═══════════ */}
      <Section id="hierarchy" title="Information Hierarchy">
        <Sub title="Visual Priority Order">
          <p className="text-[var(--text-sm)] opacity-60 mb-4">
            When scanning a card, the eye should read in this order:
          </p>
          <ol className="space-y-3 mb-6">
            {[
              {
                rank: 1,
                label: "Type Badge",
                desc: "What kind of content is this? Always top-left.",
                color: "bg-orange",
              },
              {
                rank: 2,
                label: "Project Badge",
                desc: "What project is this about? Inline after type badge.",
                color: "bg-green",
              },
              {
                rank: 3,
                label: "Body Content",
                desc: "The actual content — text, quote, link preview.",
                color: "bg-blue",
              },
              {
                rank: 4,
                label: "Media",
                desc: "Images, embeds — visual content that enriches the body.",
                color: "bg-yellow",
              },
              {
                rank: 5,
                label: "Tags",
                desc: "Categorization — small, dashed-border chips below content.",
                color: "bg-lilac",
              },
              {
                rank: 6,
                label: "Timestamp + Engagement",
                desc: "When was this posted? How have people reacted? Footer bar.",
                color: "bg-ink/30",
              },
            ].map((item) => (
              <li key={item.rank} className="flex items-start gap-3">
                <span
                  className={`flex-shrink-0 w-8 h-8 ${item.color} flex items-center justify-center font-head font-bold text-white text-[var(--text-sm)]`}
                >
                  {item.rank}
                </span>
                <div>
                  <span className="font-head font-bold text-[var(--text-sm)] uppercase">
                    {item.label}
                  </span>
                  <p className="text-[var(--text-sm)] opacity-60">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Sub>

        <Sub title="Project Association Rules">
          <div className="space-y-2 text-[var(--text-sm)]">
            <div className="flex items-center gap-2">
              <span className="text-green">✓</span>
              <span>Show ProjectBadge on cards in the unified thoughts stream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green">✓</span>
              <span>Show ProjectBadge on cards in the profile &ldquo;What&apos;s New&rdquo; feed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green">✓</span>
              <span>Show ProjectBadge on individual thought detail pages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#E53935]">✗</span>
              <span>Hide ProjectBadge when viewing that project&apos;s own page (redundant)</span>
            </div>
          </div>
        </Sub>

        <Sub title="Action Menu Placement">
          <div className="space-y-2 text-[var(--text-sm)]">
            <div className="flex items-center gap-2">
              <span className="text-green">✓</span>
              <span>Always top-right of card, opposite the type badge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green">✓</span>
              <span>Only visible to the content owner</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green">✓</span>
              <span>Share action available to all visitors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green">✓</span>
              <span>Delete always requires confirmation (two-click)</span>
            </div>
          </div>
        </Sub>
      </Section>

      {/* ═══════════ 5. IMAGE BEHAVIOR ═══════════ */}
      <Section id="images" title="Image Behavior">
        <Sub title="Rules">
          <div className="space-y-2 text-[var(--text-sm)] mb-6">
            <div className="flex items-center gap-2">
              <span className="font-mono opacity-40">1.</span>
              <span>All images use <code className="font-mono text-[var(--text-xs)] bg-ink/[0.06] px-1">border-2 border-ink</code></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono opacity-40">2.</span>
              <span>Default aspect ratio: 4:3. Overridable per context.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono opacity-40">3.</span>
              <span>All images are clickable → lightbox zoom (keyboard accessible).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono opacity-40">4.</span>
              <span>1 image: full width. 2-4: 2-column grid. 5+: grid + &ldquo;+N more&rdquo; overlay.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono opacity-40">5.</span>
              <span>Hover: subtle scale(1.02) zoom hint. Cursor: zoom-in.</span>
            </div>
          </div>
        </Sub>
      </Section>

      {/* ═══════════ 6. LAYOUT PATTERNS ═══════════ */}
      <Section id="layouts" title="Page Layout Patterns">
        <Sub title="Standard Page Container">
          <code className="font-mono text-[var(--text-xs)] opacity-50 block mb-4">
            max-w-[1100px] mx-auto px-8 py-12
          </code>
        </Sub>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardShell variant="compact" as="div">
            <h4 className="font-head font-bold text-[var(--text-sm)] uppercase mb-2">
              Stream Layout
            </h4>
            <p className="text-[var(--text-sm)] opacity-60 mb-2">
              Thoughts page, tag filtered views
            </p>
            <div className="space-y-2">
              <div className="h-3 bg-ink/[0.06] w-3/4" />
              <div className="space-y-1">
                <div className="h-16 bg-ink/[0.06] border border-ink/[0.15]" />
                <div className="h-16 bg-ink/[0.06] border border-ink/[0.15]" />
                <div className="h-16 bg-ink/[0.06] border border-ink/[0.15]" />
              </div>
            </div>
            <p className="font-mono text-[var(--text-xs)] opacity-30 mt-2">
              Filter bar → chronological card stack
            </p>
          </CardShell>
          <CardShell variant="compact" as="div">
            <h4 className="font-head font-bold text-[var(--text-sm)] uppercase mb-2">
              Grid Layout
            </h4>
            <p className="text-[var(--text-sm)] opacity-60 mb-2">
              Projects, Adventures list, Profile feed
            </p>
            <div className="grid grid-cols-2 gap-1">
              <div className="h-16 bg-ink/[0.06] border border-ink/[0.15] rotate-[-0.5deg]" />
              <div className="h-16 bg-ink/[0.06] border border-ink/[0.15] rotate-[1deg]" />
              <div className="h-16 bg-ink/[0.06] border border-ink/[0.15] rotate-[0.5deg]" />
              <div className="h-16 bg-ink/[0.06] border border-ink/[0.15] rotate-[-1deg]" />
            </div>
            <p className="font-mono text-[var(--text-xs)] opacity-30 mt-2">
              Responsive grid with playful rotations
            </p>
          </CardShell>
          <CardShell variant="compact" as="div">
            <h4 className="font-head font-bold text-[var(--text-sm)] uppercase mb-2">
              Detail Layout
            </h4>
            <p className="text-[var(--text-sm)] opacity-60 mb-2">
              Individual thought, writing article
            </p>
            <div className="space-y-1">
              <div className="h-3 bg-ink/[0.06] w-1/2" />
              <div className="h-24 bg-ink/[0.06] border border-ink/[0.15]" />
              <div className="h-12 bg-ink/[0.06] border border-ink/[0.15] ml-4" />
            </div>
            <p className="font-mono text-[var(--text-xs)] opacity-30 mt-2">
              Breadcrumb → full card → comment thread
            </p>
          </CardShell>
          <CardShell variant="compact" as="div">
            <h4 className="font-head font-bold text-[var(--text-sm)] uppercase mb-2">
              Profile Layout
            </h4>
            <p className="text-[var(--text-sm)] opacity-60 mb-2">
              User profile homepage
            </p>
            <div className="space-y-1">
              <div className="h-12 bg-ink/[0.06] border border-ink/[0.15]" />
              <div className="h-2 bg-ink/[0.06]" />
              <div className="grid grid-cols-3 gap-1">
                <div className="h-10 bg-ink/[0.06] border border-ink/[0.15]" />
                <div className="h-10 bg-ink/[0.06] border border-ink/[0.15]" />
                <div className="h-10 bg-ink/[0.06] border border-ink/[0.15]" />
              </div>
            </div>
            <p className="font-mono text-[var(--text-xs)] opacity-30 mt-2">
              Hero → ticker → 3-col feed grid
            </p>
          </CardShell>
        </div>
      </Section>

      {/* ═══════════ 7. DO'S AND DON'TS ═══════════ */}
      <Section id="dosdonts" title="Do&apos;s &amp; Don&apos;ts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-head font-bold text-[var(--text-sm)] uppercase text-green mb-3">
              Do
            </h3>
            <div className="space-y-2 text-[var(--text-sm)]">
              <p>✓ Use design tokens for all font sizes, spacing, and opacity</p>
              <p>✓ Use CardShell for every card-like container</p>
              <p>✓ Use CardFooter with EngagementBar on all content cards</p>
              <p>✓ Use TagChip for all tag-like elements</p>
              <p>✓ Use ImageGrid + ImageLightbox for all image displays</p>
              <p>✓ Use ActionMenu for owner actions on cards</p>
              <p>✓ Show ProjectBadge when content has a project association</p>
              <p>✓ Use 3px borders for card outlines, 2px for inner elements</p>
              <p>✓ Use font-head (Archivo) for headings and labels</p>
              <p>✓ Use font-mono (Space Mono) for timestamps and metadata</p>
              <p>✓ Keep border-radius at 0px (except sticker variants and avatars)</p>
            </div>
          </div>
          <div>
            <h3 className="font-head font-bold text-[var(--text-sm)] uppercase text-[#E53935] mb-3">
              Don&apos;t
            </h3>
            <div className="space-y-2 text-[var(--text-sm)]">
              <p>✗ Hardcode font sizes — use --text-* tokens</p>
              <p>✗ Use ad-hoc opacity values — use --opacity-* scale</p>
              <p>✗ Use rounded-lg or rounded-full on cards (this is a sharp-corner design system)</p>
              <p>✗ Use Tailwind gray-xxx — use ink/[opacity] instead</p>
              <p>✗ Create new card wrappers — extend CardShell variants</p>
              <p>✗ Mix tag styles — pick the right TagChip variant</p>
              <p>✗ Show images without lightbox/zoom capability</p>
              <p>✗ Show engagement on some cards but not others</p>
              <p>✗ Put action menus anywhere except top-right of cards</p>
              <p>✗ Use emoji as icons inconsistently — follow the TypeBadge mapping</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Machine-consumable design tokens ── */}
      <script
        type="application/json"
        id="sidequest-design-tokens"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            version: "1.0.0",
            typography: {
              "text-2xs": "0.55rem",
              "text-xs": "0.6rem",
              "text-sm": "0.78rem",
              "text-base": "0.92rem",
              "text-md": "1.05rem",
              "text-lg": "1.1rem",
              "text-xl": "1.3rem",
              "text-2xl": "1.6rem",
            },
            spacing: {
              "card-compact": "1rem",
              "card-standard": "1.25rem",
            },
            opacity: {
              faint: 0.03,
              subtle: 0.06,
              muted: 0.15,
              dim: 0.3,
            },
            typeColors: {
              microblog: "orange",
              bookmark: "green",
              quote: "lilac",
              question: "yellow",
              writing: "blue",
              adventure: "pink",
              project: "orange",
            },
            cardVariants: ["standard", "compact", "interactive"],
            tagVariants: ["default", "sticker", "muted"],
            fonts: {
              head: "Archivo",
              body: "DM Sans",
              mono: "Space Mono",
            },
          }),
        }}
      />
    </div>
  );
}
