-- Messages: threaded per listing. A "thread" is the (listing_id, the two
-- participants) pair — there's no separate threads table since there's no
-- realtime/typing-indicator requirement, just a fetch-on-mount inbox.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint messages_sender_recipient_distinct check (sender_id <> recipient_id)
);

create index messages_listing_id_idx on public.messages (listing_id);
create index messages_sender_id_idx on public.messages (sender_id);
create index messages_recipient_id_idx on public.messages (recipient_id);
create index messages_created_at_idx on public.messages (created_at);

alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "messages_insert_sender"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and recipient_id <> auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = recipient_id and p.school_id = public.current_school_id()
    )
  );

-- Only the recipient can flip the read flag (marking their own inbox read);
-- senders can't alter a message after sending it.
create policy "messages_update_recipient_marks_read"
  on public.messages for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
