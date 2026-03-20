# feed_events — Platform Contract

**Created:** 2026-03-20
**Ticket:** SQ.S-W-2603-0059

## Overview

`feed_events` is the single source of truth for the What's New homepage feed and any future feed (e.g. platform-level social feed). Every content type that publishes must implement this interface.

## The Three Operations

Every content type **must** implement these three operations. No exceptions.

### 1. On Publish → INSERT

When content is published (status changes to `published`), insert a row:

```sql
INSERT INTO feed_events (profile_id, event_type, object_id, object_type, visibility, published_at)
VALUES (:profile_id, :event_type, :content_id, :table_name, :visibility, now());
```

For scheduled posts: insert at actual publish time (when the cron job fires), NOT at schedule time.

### 2. On Visibility Change → UPDATE

When visibility changes (e.g. public → private):

```sql
UPDATE feed_events
SET visibility = :new_visibility
WHERE object_id = :content_id AND object_type = :table_name;
```

### 3. On Delete → DELETE

When content is deleted:

```sql
DELETE FROM feed_events
WHERE object_id = :content_id AND object_type = :table_name;
```

## Event Types

| Event Type | Content Type | Table |
|---|---|---|
| `microblog_published` | Microblog post | `microblog_posts` |
| `writing_published` | Writing | `writings` |
| `bookmark_published` | Bookmark | `bookmarks` |
| `quote_published` | Quote | `quotes` |
| `question_published` | Question | `questions` |
| `photo_added` | Photo | `photos` |
| `project_created` | New project | `projects` |
| `project_updated` | Project update | `projects` |
| `project_backed` | Backed project | `crowdfunding_projects` |
| `adventure_published` | Adventure | `adventures` |
| `career_updated` | Career update | `company_roles` |
| `profile_updated` | Profile change | `profiles` |
| `reshared` | Reshare of Thoughts content | `feed_events` (self-ref) |

## Base Feed Query

```sql
SELECT *
FROM feed_events
WHERE profile_id = :profile_id
  AND visibility = 'public'
  AND published_at <= now()
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY published_at DESC
LIMIT :limit
OFFSET :offset;
```

## Special Fields

- **`expires_at`** — Set at creation time for `profile_updated` events only. Uses author's suppression setting (default 3 months). No retroactive recalculation.
- **`photo_batch_id`** — Groups photos from same upload session (30-min window). One feed_events row per batch, not per photo.
- **`reshare_of_event_id`** — For `reshared` events. FK to the original feed_events row. Max 1 reshare per item per 7 days.

## Index

Primary: `(profile_id, visibility, published_at DESC)` — covers the base feed query.
