-- D&D Documentation Pages
-- Hierarchical pages with RLS per user

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Pages table: each page has optional parent for nesting
create table public.pages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.pages(id) on delete cascade,
  title text not null default 'Untitled',
  content jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_pages_user_id on public.pages(user_id);
create index idx_pages_parent_id on public.pages(parent_id);
create index idx_pages_sort_order on public.pages(user_id, parent_id, sort_order);

-- Enable RLS
alter table public.pages enable row level security;

-- RLS Policies: users can only access their own pages
create policy "Users can view own pages"
  on public.pages for select
  using (auth.uid() = user_id);

create policy "Users can insert own pages"
  on public.pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pages"
  on public.pages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own pages"
  on public.pages for delete
  using (auth.uid() = user_id);

-- Function to auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_pages_updated
  before update on public.pages
  for each row execute function public.handle_updated_at();

-- Function to set default sort_order on insert
create or replace function public.set_default_sort_order()
returns trigger as $$
begin
  if new.sort_order = 0 then
    select coalesce(max(sort_order), 0) + 1 into new.sort_order
    from public.pages
    where user_id = new.user_id
      and parent_id is not distinct from new.parent_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_pages_set_sort_order
  before insert on public.pages
  for each row execute function public.set_default_sort_order();
