create extension if not exists "pgcrypto";

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id text not null default 'main',
  name text not null,
  category text not null default '早餐',
  note text not null default '',
  occasion text not null default '',
  tags jsonb not null default '[]'::jsonb,
  favorite boolean not null default false,
  image_url text not null,
  image_path text,
  created_at timestamptz not null default now()
);

create index if not exists menu_items_menu_id_created_at_idx
  on public.menu_items (menu_id, created_at desc);

alter table public.menu_items enable row level security;

drop policy if exists "Public menu read" on public.menu_items;
create policy "Public menu read"
  on public.menu_items for select
  using (true);

drop policy if exists "Public menu insert" on public.menu_items;
create policy "Public menu insert"
  on public.menu_items for insert
  with check (true);

drop policy if exists "Public menu update" on public.menu_items;
create policy "Public menu update"
  on public.menu_items for update
  using (true)
  with check (true);

drop policy if exists "Public menu delete" on public.menu_items;
create policy "Public menu delete"
  on public.menu_items for delete
  using (true);

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public menu image read" on storage.objects;
create policy "Public menu image read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

drop policy if exists "Public menu image upload" on storage.objects;
create policy "Public menu image upload"
  on storage.objects for insert
  with check (bucket_id = 'menu-images');

drop policy if exists "Public menu image update" on storage.objects;
create policy "Public menu image update"
  on storage.objects for update
  using (bucket_id = 'menu-images')
  with check (bucket_id = 'menu-images');

drop policy if exists "Public menu image delete" on storage.objects;
create policy "Public menu image delete"
  on storage.objects for delete
  using (bucket_id = 'menu-images');

