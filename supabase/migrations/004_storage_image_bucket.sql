-- Storage bucket for editor images
insert into storage.buckets (id, name, public)
values ('page-images', 'page-images', true)
on conflict (id) do nothing;

-- Only authenticated users can upload, and only into their own folder ({user_id}/...)
create policy "Users can upload own images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'page-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete only their own images
create policy "Users can delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'page-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read (bucket is public, URLs are unguessable UUIDs)
create policy "Anyone can view page images"
  on storage.objects for select
  using (bucket_id = 'page-images');
