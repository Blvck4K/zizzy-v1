-- Create Insights Table
create table if not exists public.insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  summary text not null,
  source_context text, -- Optional context or pointer to chat/message
  pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.insights enable row level security;

-- Policies
create policy "Users can view their own insights"
  on public.insights for select
  using (auth.uid() = user_id);

create policy "Users can insert their own insights"
  on public.insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own insights"
  on public.insights for update
  using (auth.uid() = user_id);

create policy "Users can delete their own insights"
  on public.insights for delete
  using (auth.uid() = user_id);
