# Backlog: Building sidequest.me with Claude Cowork

## Project
Personal homepage for Sophie Collins — neo-brutalist design, Next.js + TypeScript + Tailwind CSS v4.

## What This Document Is
A combined backlog and process log. It captures:
1. **Process observations** — what works and what doesn't in how we collaborate
2. **Experiment backlog** — features or design decisions Sophie wants to circle back on after the site is live, each framed as a testable experiment

---

## Experiment Backlog

Items Sophie is unsure about or that should be revisited post-launch. Each is framed as an A/B test or experiment to run with real content/users.

| # | Experiment | Current Choice | Alternative | When to Test | Status |
|---|-----------|---------------|-------------|-------------|--------|
| 1 | Tube line colour | Brand colour (matches company) | Ink black (neutral, consistent) | After Phase 4 implementation — test with real company data across all cards | Queued |
| 2 | Current role marker style | Filled circle | Ring + dot (hollow with inner dot) | After Phase 4 — test readability at different sizes | Queued |
| 3 | Left accent stripe thickness | 6px (current) | Thicker / thinner variants | After Phase 4 — test visual weight balance across card types | Queued |


---

## Process Observations — Phase 1 (Card Design)

### What Worked Well

1. **HTML previews as a design tool** — standalone files Sophie opens locally, fast iteration without build tools
2. **Presenting multiple options with clear labels** — Style A through F comparisons let Sophie react to concrete visuals, not abstract descriptions
3. **Helping the client think, not just choose** — prompting for reactions rather than just "pick one" surfaces deeper preferences
4. **Iterating in rounds with clear version numbers** — v1 → v7 kept momentum and made it easy to reference past decisions
5. **Real-world references as design shorthand** — London Tube Map as timeline metaphor instantly communicated the intent
6. **Structured experiments alongside safe iterations** — wildcards sit next to refinements so Sophie can explore without risk
7. **Eliminating options decisively** — killing styles C, D, F early prevented decision fatigue in later rounds
8. **Interactive feedback forms (v6+)** — structured questions + AB tests + freeform text generated clipboard-ready markdown feedback
9. **Deferring uncertain decisions to backlog** — "Not sure — backlog it" as a first-class option prevented pressure to decide prematurely
10. **Snake experiments generated new thinking (v7)** — the multi-variant snake prototypes triggered Sophie's multi-discipline tube map insight

### What Could Be Improved

1. **Build verification gap** — should open and visually check each HTML preview before sending to Sophie
2. **Context window pressure** — long sessions risk losing earlier context; the backlog doc mitigates this
3. **Pacing** — sometimes multiple changes per round when Sophie might prefer smaller, more focused iterations
4. **Centering precision matters** — small alignment differences are noticeable and worth getting right before moving on

---

## Decisions Log

| Version | Decision | Choice Made | Reasoning |
|---------|----------|-------------|-----------|
| v1 | Layout style | Styles A+E shortlisted | Sophie liked the flat/clean approach (E) and the chunky approach (A) |
| v1 | Eliminated styles | C, D, F dropped | Too editorial (C), too minimal (D), too card-heavy (F) |
| v2 | Tag shapes | Rectangular (role) + lozenge (category) | Visual distinction between tag types |
| v2 | Blurb labels | "The Company, Time & Place" + "How I Helped Them" | Two-column layout with conversational labels |
| v3 | Multi-role display | Tube Map timeline | London Tube Map metaphor for career progression within a company |
| v3 | Tag colouring | Neutral (ink border, transparent fill) | Prevents visual noise; brand colour reserved for accent stripe |
| v3 | Company branding | Left accent stripe in brand colour | Subtle but distinctive per-company identity |
| v3 | Logo approach | Coloured square with initials | Placeholder pattern that works without actual logo files |
| v4 | Layout style final | Style E only | A eliminated — E was consistently preferred in every comparison |
| v5 | Timeline style | Title-centred circles | Circles align to role title text centre, not full entry block |
| v5 | Timeline variants | Brand colour line + filled current role | Tested multiple variants, Sophie preferred branded + filled |
| v6 | Timeline alignment | Dynamic JS positioning | JavaScript calculates title centre for precise circle placement |
| v6 | Timeline spacing | 30px padding-left (from 34px) | ~10% tighter per Sophie's feedback |
| v6 | Feedback workflow | Interactive HTML form | Structured questions with AB tests, scales, and freeform text |
| v6 | Tube line colour | Backlogged | Sophie unsure — added as Experiment #1 |
| v6 | Current role marker | Backlogged | Sophie unsure — added as Experiment #2 |
| v7 | Circle size | Reduced from 16px to 12px | Sophie said "too big" — now "just right" |
| v7 | Timeline spacing | Increased entry padding | v6 rated 4/10, v7 "just right" |
| v7 | Blurb label rename | "Some stuff I did there" | Replaces "How I Helped Them" — more Sophie's voice |
| v7 | Text/logo alignment | Bottom-align text with logo square | Close but not quite in v7 — needs further fix |
| v7 | Left stripe thickness | Backlogged | Sophie wants to test thicker/thinner variants — Experiment #3 |
| v7 | Snake direction | A: Junior→Senior (left→right) preferred | Scored 8/10, B scored 5/10 — clear winner |
| v7 | Snake vs Vertical | Hybrid — explore more | Neither pure snake nor vertical — Sophie wants best of both |
| v7 | Storytelling anecdotes | Nice idea, needs work | Concept liked, execution needs refinement |
| v8 | Multi-discipline tube map | New concept — colour-coded career lines | Red=Commercial, Blue=Product, Green=Marketing. Sideways moves between disciplines shown as line changes |
| v8 | Tag position (single-role) | Move to top-right | Too much whitespace in top-right of single-role cards — rated "Much better" in v8 feedback |
| v8 | Logo/text alignment | Top of name aligns logo top, dates align logo bottom | Still off in v8 — Sophie changed mind, see v9 approach |
| v8 | Interchange nodes | Rejected | Sophie: "Don't like them" — remove for v9 |
| v8 | Tube map rendering | Broken — 3/10 | Lines missing, text hanging off page. Critical fix needed. |
| v9 | Alignment rethink | Name top aligns logo top, dates below on new line | Simpler approach — dates underneath, not alongside |
| v9 | Start year as big coloured number | Experiment | Large coloured year number to the left of the station circle |
| v9 | Years-between-stations | Experiment | Light grey number showing years between stations, next to line on left |
| v9 | Discipline legend as tags | Move to top-left of card | Coloured tags matching tube line colours, may allow dropping discipline from top-right tags |

---

## Session Timeline

| Session | Date | Focus | Key Outputs |
|---------|------|-------|-------------|
| 1 | 2026-02-25 | Full site build | All 7 pages built, deployed structure, globals.css, nav, responsive |
| 2 | 2026-02-26 | Card redesign v1–v3 | Style exploration (A–F), tag system, tube map timeline, brand colours |
| 3 | 2026-02-27 | Card redesign v4–v6 | Style E final, timeline refinement, dynamic positioning, feedback forms |
| 4 | 2026-02-28 | v6 feedback + v7 planning | Received structured feedback, added 3 experiments to backlog, planning snake timeline variants |
| 5 | 2026-03-01 | v7 build — snake timeline experiments | Built 3 snake layout variants + refinements from v6 feedback |
| 6 | 2026-03-01 | v7 feedback + v8 build — multi-discipline tube map | Sophie's breakthrough idea: career as a tube map with colour-coded discipline lines |
| 7 | 2026-03-01 | v8 feedback + v9 build | Tube map 3/10 (broken rendering), interchanges rejected, new alignment + year labels + legend experiments |

---

## Sophie's 1E Career Path (for v8 tube map)

This is the full career journey at 1E, with discipline colour coding:

| # | Role | Discipline | Tube Line Colour | Move Type |
|---|------|-----------|-----------------|-----------|
| 1 | Solutions Engineer | Commercial/Selling | Red (#E53935) | Entry |
| 2 | Solutions Engineering Lead | Commercial/Selling | Red (#E53935) | Promotion (vertical) |
| 3 | Product Manager | Product & Development | Blue (#1E88E5) | Sideways move (horizontal) |
| 4 | Senior Product Manager | Product & Development | Blue (#1E88E5) | Promotion (vertical) |
| 5 | Product Marketing Manager | Marketing & Strategy | Green (#43A047) | Sideways move (horizontal) |
| 6 | Senior Product Marketing Mgr | Marketing & Strategy | Green (#43A047) | Promotion (vertical) |
| 7 | VP Product Marketing | Marketing & Strategy | Green (#43A047) | Promotion (vertical) |

Key design principles:
- Promotions = vertical movement (same colour line continues upward)
- Discipline changes = horizontal movement (line colour changes at "interchange" node)
- Interchange nodes styled differently (like tube map interchange symbols)
- Inspired by: London Underground map + Google Maps tube journey view

---

*Last updated: 2026-03-01 — Session 7*
