-- Migration 004: Adventures
-- Applied: 2026-03-17
-- Creates adventures + adventure_posts tables with RLS
-- Adds adventure_id FK to photos table
-- See adventures-ux-concepts.html for layout theme designs

-- (Migration SQL applied via Supabase MCP - see create_adventures migration)
-- Layout themes: journal, magazine, map, stream, dashboard
-- Post types: micro, photo, checkin, article_link
