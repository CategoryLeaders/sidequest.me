# Sophie's Asana Task Rules

> **Purpose:** A machine-readable reference for any AI agent (Claude Code, Cowork, scheduled tasks, etc.) to correctly file, update, and move tasks in Sophie's Asana workspace.
>
> **Workspace:** `My Workspace` (GID: `1202415985835777`)
> **Owner:** Sophie Collins (GID: `1202416061789558`)

---

## 1. Project Index

Sophie's workspace has **11 projects** across three distinct workflow types. Every task must belong to exactly one project.

| Project | GID | Type | Domain |
|---|---|---|---|
| 21 Linden Road | `1202416062156804` | Room-based | House renovation |
| OnePageWonder | `1213378906918773` | Dev Kanban | SaaS product (agentic) |
| ProductLobby | `1213389148110065` | Dev Kanban | SaaS product |
| Ripley | `1213389149631110` | GTD | Vehicles (van + Ekrano) |
| Hack the Box | `1213389149637801` | GTD | Day job (PMM / cybersecurity) |
| Category Leaders / SideQuest Ventures | `1213389151328947` | GTD | Company admin |
| Personal | `1213389151536324` | Category-based | Life / health / hobbies |
| Burns & Burner Leadership | `1213389151791244` | GTD | Events community |
| Writing & Content Projects | `1213402770509984` | Book-based | Writing projects |
| Revision.Sucks | `1213427240776183` | Dev Kanban | EdTech email product |
| SideQuest.me | `1213468594164941` | Dev Kanban | SideQuest platform / website |

---

## 2. Workflow Types & Section Maps

### 2a. GTD Workflow (4 projects)

**Used by:** Ripley, Hack the Box, Category Leaders, Burns & Burner Leadership

These projects follow a Getting Things Done–inspired flow. Sections may appear in different orders in the UI, but the logical flow is always:

```
Inbox → Next Action → In Progress → Waiting → Done
```

**Section GID Lookup:**

| Project | Inbox | Next Action | In Progress | Waiting | Done |
|---|---|---|---|---|---|
| Ripley | `1213390532320979` | `1213390532303370` | `1213390532327467` | `1213390537066305` | `1213390537493973` |
| Hack the Box | `1213389720625755` | `1213389720634140` | `1213389721318085` | `1213389722160320` | `1213389720672540` |
| Category Leaders | `1213389721318089` | `1213389722739640` | `1213389725954312` | `1213389721310904` | `1213389725953028` |
| Burns & Burner | `1213390524032965` | `1213390524025808` | `1213390537331075` | `1213390537493813` | `1213390532294617` |

**GTD Filing Rules:**

| Situation | Target Section | Also Do |
|---|---|---|
| New task, not yet triaged | **Inbox** | — |
| Task is clear and ready to act on | **Next Action** | — |
| Sophie (or agent) is actively working on it | **In Progress** | — |
| Blocked on someone else / waiting for a response | **Waiting** | Add a comment noting who/what is being waited on |
| Task is finished | **Done** | Mark `completed: true` |

---

### 2b. Dev Kanban Workflow (4 projects)

**Used by:** ProductLobby, Revision.Sucks, OnePageWonder, SideQuest.me

These projects follow a product development kanban. The flow is:

```
Backlog (PM Spec'd) → Ready for Product Design → With Product Design → Ready for Development → In Development → Ready for QA → In QA → Tested & Live
```

**Section GID Lookup:**

| Project | Backlog | Ready for Design | With Design | Ready for Dev | In Dev | Ready for QA | In QA | Tested & Live |
|---|---|---|---|---|---|---|---|---|
| ProductLobby | `1213372426433867` | `1213426752001765` | `1213361872886848` | `1213389722748127` | `1213361872912737` | `1213426752001766` | `1213399662318425` | `1213389721320288` |
| Revision.Sucks | `1213375333464725` | `1213427242519641` | `1213427241882314` | `1213427241220486` | `1213427241882225` | `1213427222443372` | `1213403941038017` | `1213427242544020` |
| OnePageWonder | *(only has untitled section — `1213435557499464`)* | — | — | — | — | — | — | — |
| SideQuest.me | *(sections pending — create manually then fill GIDs below)* | — | — | — | — | — | — | — |

> **⚠️ ACTION REQUIRED:** SideQuest.me kanban sections must be created manually in the Asana board view.
> Create these 8 sections (in order): Backlog (PM Spec'd), Ready for Product Design, With Product Design,
> Ready for Development, In Development, Ready for QA, In QA, Tested & Live.
> Then update this table with the GIDs from `asana_get_project_sections`.

**Dev Kanban Filing Rules:**

| Situation | Target Section | Also Do |
|---|---|---|
| New feature idea / spec written | **Backlog (PM Spec'd)** | Include description with acceptance criteria |
| Spec approved, needs design | **Ready for Product Design** | — |
| Designer is actively working | **With Product Design** | — |
| Design done, needs dev | **Ready for Development** | — |
| Developer is actively building | **In Development** | — |
| Code done, needs testing | **Ready for QA** | — |
| Tester is actively testing | **In QA** | — |
| Shipped and verified | **Tested & Live** | Mark `completed: true` |

**Naming Conventions:**
- **Revision.Sucks:** Tasks use prefix `RS-NNNNN` (e.g. `RS-00001`, `RS-00002`). Increment from the highest existing number.
- **SideQuest.me:** Tasks use prefix `SQ-NNNNN` (e.g. `SQ-00001`, `SQ-00002`). Increment from the highest existing number.

**Custom Fields:**
- **Revision.Sucks** has a **Priority** custom field (GID: `1213427242445926`) with values: Low, Medium, High.
- **SideQuest.me** should follow the same Priority convention once sections are configured.
- **SideQuest.me** has a **Waiting for** custom dropdown field (GID: `PENDING — create in Asana`) with values:
  - `None` — no one is waiting
  - `Waiting for Sophie` — Sophie needs to review/decide/provide input
  - `Waiting for PM` — PM agent should pick up
  - `Waiting for Design` — Design agent should pick up
  - `Waiting for Dev` — Dev agent should pick up
  - `Waiting for QA` — QA agent should pick up

> **⚠️ ACTION REQUIRED:** Create the "Waiting for" custom dropdown field on the SideQuest.me project
> in Asana (Project Settings → Custom Fields → Add Field → Dropdown). Then update the GID above
> and the option GIDs in `.env.local`.

---

### 2c. Room-Based Workflow (1 project)

**Used by:** 21 Linden Road

This renovation project is organised by **physical location** in the house, not by workflow stage. Tasks go into the section matching the room or system they relate to.

```
Triage → [Room/System Section] → (completed when done)
```

**Section GID Lookup:**

| Section | GID |
|---|---|
| Triage | `1213390537771786` |
| Basement | `1213455536255964` |
| General First Floor | `1213454278950759` |
| Bathroom | `1213455536255980` |
| Main Bedroom | `1213396463074002` |
| Bedroom 3 (Front) | `1213396463074012` |
| Electrical Tasks | `1213396463074005` |
| Kitchen Extension | `1213396463074008` |
| Hall & Landing | `1213396467255694` |
| Garden & Outbuilding | `1213396467255697` |
| Study | `1213401663539927` |
| Lounge | `1213401663539924` |
| Downstairs Bathroom | `1213401663435370` |
| General Plumbing and Water Systems | `1213455536255970` |
| Misc | `1213454679078518` |

**Room-Based Filing Rules:**

| Situation | Target Section |
|---|---|
| New task, not yet categorised | **Triage** |
| Task relates to a specific room | The matching **room section** |
| Task relates to electrics across multiple rooms | **Electrical Tasks** |
| Task relates to plumbing/water across multiple rooms | **General Plumbing and Water Systems** |
| Task relates to general first-floor work (not room-specific) | **General First Floor** |
| Task doesn't fit anywhere | **Misc** |

---

### 2d. Category-Based Workflow (2 projects)

**Used by:** Personal, Writing & Content Projects

These projects use **topic sections** rather than workflow stages.

**Personal** (GID: `1213389151536324`):

| Section | GID |
|---|---|
| Inbox | `1213390537498888` |
| Health | `1213402770509963` |
| Kickstarter & Toys | `1213402770509966` |
| Admin & Bills | `1213402770509969` |
| Friends and Social | `1213402770509972` |
| Sex, Kink & Play | `1213402770509979` |
| Done | `1213390532313424` |

**Writing & Content Projects** (GID: `1213402770509984`):

| Section | GID |
|---|---|
| The Last Marketer | `1213415893810547` |
| From Surrey to Sahara | `1213415893810550` |

**Category Filing Rules:**

| Situation | Target |
|---|---|
| New personal task, not categorised | Personal → **Inbox** |
| Health, fitness, medical, therapy | Personal → **Health** |
| Crowdfunding, gadgets, hobby purchases | Personal → **Kickstarter & Toys** |
| Bills, utilities, personal admin | Personal → **Admin & Bills** |
| Social plans, events with friends | Personal → **Friends and Social** |
| Writing task for the marketing book | Writing → **The Last Marketer** |
| Writing task for the travel book | Writing → **From Surrey to Sahara** |

---

## 3. Project Selection Rules

When an agent needs to decide **which project** a task belongs to, use this decision tree:

```
Is it about the house at 21 Linden Road?
  → YES → 21 Linden Road

Is it about building/shipping software?
  → Is it ProductLobby (SaaS platform, campaigns, marketplace)?
    → YES → ProductLobby
  → Is it Revision.Sucks (student revision, email sequences, Kit/ConvertKit)?
    → YES → Revision.Sucks
  → Is it OnePageWonder (agentic development)?
    → YES → OnePageWonder
  → Is it SideQuest.me (SideQuest platform, website, brand)?
    → YES → SideQuest.me

Is it about Hack the Box (cybersecurity, analyst relations, PMM, blue team)?
  → YES → Hack the Box

Is it about company admin (HMRC, Companies House, accountancy, Xero, expenses, legal)?
  → YES → Category Leaders / SideQuest Ventures

Is it about the van, Ekrano, or vehicle electrical/mechanical work?
  → YES → Ripley

Is it about Burning Man regionals (Burning Nest, Microburn, ELS, burns)?
  → YES → Burns & Burner Leadership

Is it about writing a book?
  → YES → Writing & Content Projects

Is it personal (health, hobbies, social, admin, bills)?
  → YES → Personal
```

**Ambiguity Rule:** If a task could belong to multiple projects, prefer the more specific project. For example, "Write blog post about ProductLobby launch" goes in **ProductLobby** (not Writing). "Pay electricity bill" goes in **Personal → Admin & Bills** (not Category Leaders, which is for *company* admin).

---

## 4. Task Creation Standards

When creating a new task, always follow these conventions:

### Required Fields
- **name**: Clear, action-oriented title (verb first when possible). E.g. "Call chippy about stud walling" not "Chippy".
- **project_id**: The correct project GID from the index above.
- **section_id**: The correct section GID based on the workflow rules.

### Optional but Encouraged
- **notes** or **html_notes**: Context, links, specs. For dev kanban tasks, include acceptance criteria.
- **due_on**: If there's a real deadline.
- **assignee**: `1202416061789558` (Sophie) unless explicitly told otherwise.

### Naming Conventions
- **Revision.Sucks tasks**: Prefix with `RS-NNNNN` (5-digit, zero-padded, incrementing).
- **SideQuest.me tasks**: Prefix with `SQ-NNNNN` (5-digit, zero-padded, incrementing).
- **21 Linden Road tasks**: Include the room/area in the name if not obvious from section. E.g. "Carpets & Underlay (All First Floor)".
- **All other projects**: Plain English, action-oriented.

---

## 5. Task Update Rules

### Moving Tasks Between Sections

When updating a task's status, move it to the correct section within its project. **Never move tasks between projects** without explicit instruction.

To move a task to a new section, use `asana_get_project_sections` to get the section GID, then create a new task-section membership or use the appropriate API call.

### Completing Tasks

When a task is finished:
1. Set `completed: true` on the task.
2. For GTD projects, also move to **Done** section.
3. For Dev Kanban projects, also move to **Tested & Live** section.
4. For Room-based projects, just mark completed (it stays in its room section).

### Adding Comments

Use `asana_create_task_story` to add comments when:
- A task moves to **Waiting** — note who/what is being waited on.
- An agent performs work related to the task — summarise what was done.
- A blocker is identified — describe the blocker.

---

## 6. Priority & Urgency Signals

Sophie doesn't use Asana's priority field consistently, so infer urgency from:

| Signal | Meaning |
|---|---|
| Task has a `due_on` date approaching or past | Urgent — flag it |
| Task is in **Inbox** for a long time | Needs triage — prompt Sophie |
| Task name contains "URGENT", "ASAP", "deadline" | Treat as high priority |
| Task is in **Waiting** with no recent activity | May need a follow-up nudge |
| Company admin tasks near month/quarter end | Likely time-sensitive (HMRC, filings) |

---

## 7. Agent Behaviour Guidelines

1. **Never delete tasks.** Mark them complete or ask Sophie.
2. **Never create duplicate tasks.** Search first using `asana_search_tasks` or `asana_typeahead_search`.
3. **Always confirm before bulk operations** (moving 5+ tasks, completing multiple tasks).
4. **When in doubt, file to Inbox/Triage.** It's better to let Sophie triage than to misfile.
5. **Preserve existing task descriptions.** When updating notes, append rather than overwrite.
6. **Log your work.** When an agent completes work related to a task, add a comment summarising what was done.
7. **Respect the workflow type.** Don't apply GTD sections to a dev kanban project or vice versa.

---

---

## 8. SideQuest.me — Design & PM Mockup Integration

SideQuest.me uses a live feedback loop between static HTML mockup pages and Asana tasks. There are two mockup types:

### 8a. UX Test Pages (Design Mockups)

- **Location:** `https://sidequest.me/dev/uxtests/SQ-XXXXX.html` (or `-description.html`)
- **Purpose:** Visual UI prototypes for Sophie to review and rate
- **Feedback mechanism:** Embedded `feedback-widget.js` with rating sliders (1–10 per criterion)
- **Widget config:** `data-type="ux"` with `data-criteria="Criterion1,Criterion2,..."`

**Design agent workflow:**
1. Build the mockup HTML in `/public/dev/uxtests/SQ-XXXXX.html`
2. Include the feedback widget: `<script src="/dev/feedback-widget.js" data-task-ref="SQ-XXXXX" data-type="ux" data-criteria="...">`
3. Deploy to sidequest.me (via `vercel deploy --prod --yes`)
4. Post a comment on the Asana task with the live URL
5. Set "Waiting for" → `Waiting for Sophie`
6. Move task to appropriate section (e.g. "With Product Design")

### 8b. PM Spec Pages (Decision Tools)

- **Location:** `https://sidequest.me/dev/pmspecs/SQ-XXXXX.html` (or `-description.html`)
- **Purpose:** Interactive decision pages — surveys, option selectors, trade-off comparisons
- **Feedback mechanism:** Embedded `feedback-widget.js` with option cards
- **Widget config:** `data-type="pm"` with `data-options="Option A,Option B,..."`

**PM agent workflow:**
1. Investigate the feature/question, research options
2. Build the decision page HTML in `/public/dev/pmspecs/SQ-XXXXX.html`
3. Include the feedback widget: `<script src="/dev/feedback-widget.js" data-task-ref="SQ-XXXXX" data-type="pm" data-options="...">`
4. Deploy to sidequest.me
5. Post a comment on the Asana task with the live URL
6. Set "Waiting for" → `Waiting for Sophie`

### 8c. Feedback Flow (Both Types)

When Sophie interacts with a mockup page and clicks **Submit to Asana**:
1. Widget POSTs to `/api/feedback` with ratings/selection + optional comment
2. API route looks up the task by `SQ-XXXXX` prefix
3. Posts a formatted comment on the Asana task (with ratings bars, selection, comments)
4. Optionally flips the "Waiting for" field (if `data-waiting-field-gid` and `data-waiting-option-gid` are set on the widget)
5. The responsible agent picks up the feedback on its next check

**Fallback:** If the API is down or PAT not configured, Sophie can click **Copy as prompt** to get clipboard text she can paste into a conversation or Asana comment manually.

---

## 9. FeatureRequest Shortcut

When Sophie says **"FeatureRequest: {description}"** in a conversation:

1. **PM agent** creates a new SQ-XXXXX task in the SideQuest.me project (Backlog section)
2. PM investigates the feature — researches options, identifies trade-offs
3. PM builds an interactive decision page at `/dev/pmspecs/SQ-XXXXX.html`
4. PM deploys to sidequest.me
5. PM comments on the task with the live URL
6. PM sets "Waiting for" → `Waiting for Sophie`
7. Sophie reviews the decision page, picks an option, submits feedback
8. Feedback lands as an Asana comment on the task
9. PM picks up Sophie's decision, iterates or moves the task forward to Design/Dev

---

## 10. Agent Polling & Scheduled Check-ins

A **scheduled hourly task** should check the SideQuest.me project for tasks awaiting each agent role.

**Polling logic:**
- Query tasks where "Waiting for" = `Waiting for PM` → PM agent picks up
- Query tasks where "Waiting for" = `Waiting for Design` → Design agent picks up
- Query tasks where "Waiting for" = `Waiting for Dev` → Dev agent picks up
- Query tasks where "Waiting for" = `Waiting for QA` → QA agent picks up
- Tasks where "Waiting for" = `Waiting for Sophie` → Skip (Sophie acts on her own schedule)
- Tasks where "Waiting for" = `None` → Check section position to determine if action is needed

**Implementation:** Use `asana_search_tasks` with `custom_fields` filter on the "Waiting for" field GID, or iterate project tasks and check the field value.

---

*Last updated: 2026-03-01*
*Generated from live Asana workspace data. Updated with mockup integration, FeatureRequest shortcut, and agent polling.*
