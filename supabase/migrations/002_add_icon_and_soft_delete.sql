-- Add icon column for page emoji/icon
alter table public.pages add column icon text not null default '';

-- Add soft delete column
alter table public.pages add column deleted_at timestamptz default null;

-- Index for filtering deleted pages
create index idx_pages_deleted_at on public.pages(user_id, deleted_at);

-- Update RLS policies to include deleted_at awareness
-- (RLS still lets user access their own rows regardless of deleted_at,
--  filtering is done in the application layer)
