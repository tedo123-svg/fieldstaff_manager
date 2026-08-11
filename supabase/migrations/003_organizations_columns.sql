-- ============================================================
-- Migration 003: Add missing columns to organizations table
-- Run this in your Supabase SQL editor
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS name_en      text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS name_om      text,
  ADD COLUMN IF NOT EXISTS description  text,
  ADD COLUMN IF NOT EXISTS color        text NOT NULL DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS bg_color     text NOT NULL DEFAULT 'bg-[#3B82F6]',
  ADD COLUMN IF NOT EXISTS text_color   text NOT NULL DEFAULT 'text-white',
  ADD COLUMN IF NOT EXISTS icon         text NOT NULL DEFAULT '🔵',
  ADD COLUMN IF NOT EXISTS member_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_count integer NOT NULL DEFAULT 0;

-- has_groups was added in migration 001, skip if already exists
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS has_groups boolean NOT NULL DEFAULT false;
