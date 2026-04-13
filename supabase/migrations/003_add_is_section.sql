-- Replace characters table with is_section flag on pages
-- Sections are root-level pages that act as visual group headers (e.g., "Characters", "Cities")

alter table public.pages add column is_section boolean not null default false;
