-- Ad Swipe File — Supabase Schema
-- Run this in the Supabase SQL Editor

-- ─── ADS TABLE ──────────────────────────────────────────────────────────────
create table if not exists ads (
  id                   text primary key,
  advertiser_name      text not null,
  advertiser_page_id   text,
  platform             text default 'meta',
  status               text default 'ACTIVE',
  media_type           text default 'unknown',
  primary_text         text,
  headline             text,
  description          text,
  cta_type             text,
  link_url             text,
  image_url            text,
  video_url            text,
  storage_image_path   text,
  storage_video_path   text,
  start_date           timestamptz,
  end_date             timestamptz,
  -- Meta Ad Library fields
  bylines              text,
  languages            jsonb default '[]',
  publisher_platforms  jsonb default '[]',
  -- Enrichment
  estimated_spend_min  numeric,
  estimated_spend_max  numeric,
  estimated_spend_mid  numeric,
  spend_confidence     text,
  performance_score    int,
  days_active          int,
  pixels               jsonb default '[]',
  tech_stack           jsonb default '[]',
  video_transcription  text,
  enriched_at          timestamptz,
  raw_data             jsonb,
  scraped_at           timestamptz default now()
);

create index if not exists ads_advertiser_name_idx on ads(advertiser_name);
create index if not exists ads_status_idx on ads(status);
create index if not exists ads_platform_idx on ads(platform);
create index if not exists ads_scraped_at_idx on ads(scraped_at desc);
create index if not exists ads_performance_score_idx on ads(performance_score desc);

-- ─── COLLECTIONS ─────────────────────────────────────────────────────────────
create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  name        text not null,
  description text,
  color       text default '#000000',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists collections_user_id_idx on collections(user_id);

-- ─── SAVED ADS ───────────────────────────────────────────────────────────────
create table if not exists saved_ads (
  id            uuid primary key default gen_random_uuid(),
  ad_id         text references ads(id) on delete cascade,
  collection_id uuid references collections(id) on delete cascade,
  notes         text,
  tags          jsonb default '[]',
  saved_at      timestamptz default now(),
  unique(ad_id, collection_id)
);

create index if not exists saved_ads_collection_id_idx on saved_ads(collection_id);
create index if not exists saved_ads_ad_id_idx on saved_ads(ad_id);

-- ─── SCRAPE JOBS ─────────────────────────────────────────────────────────────
create table if not exists scrape_jobs (
  id           uuid primary key default gen_random_uuid(),
  query        text,
  job_type     text default 'keyword',
  status       text default 'pending',
  ads_found    int default 0,
  error        text,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz default now()
);

create index if not exists scrape_jobs_status_idx on scrape_jobs(status);
create index if not exists scrape_jobs_created_at_idx on scrape_jobs(created_at desc);

-- ─── BRAND MONITORS (Phase 2) ─────────────────────────────────────────────
create table if not exists brand_monitors (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade,
  brand_name      text not null,
  page_id         text,
  is_active       boolean default true,
  interval_hours  int default 24,
  last_checked_at timestamptz,
  created_at      timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table ads enable row level security;
alter table collections enable row level security;
alter table saved_ads enable row level security;
alter table scrape_jobs enable row level security;
alter table brand_monitors enable row level security;

-- Ads: anyone can read, service role can write
create policy "Anyone can read ads" on ads for select using (true);
create policy "Service role can insert ads" on ads for insert with check (true);
create policy "Service role can update ads" on ads for update using (true);

-- Collections: users own their collections
create policy "Users can read own collections" on collections for select using (auth.uid() = user_id);
create policy "Users can insert own collections" on collections for insert with check (auth.uid() = user_id);
create policy "Users can update own collections" on collections for update using (auth.uid() = user_id);
create policy "Users can delete own collections" on collections for delete using (auth.uid() = user_id);

-- Saved ads: via collection ownership
create policy "Users can read saved ads in their collections"
  on saved_ads for select
  using (collection_id in (select id from collections where user_id = auth.uid()));

create policy "Users can save ads to their collections"
  on saved_ads for insert
  with check (collection_id in (select id from collections where user_id = auth.uid()));

create policy "Users can delete saved ads from their collections"
  on saved_ads for delete
  using (collection_id in (select id from collections where user_id = auth.uid()));

-- Scrape jobs: anyone can read, service role writes
create policy "Anyone can read scrape jobs" on scrape_jobs for select using (true);
create policy "Anyone can insert scrape jobs" on scrape_jobs for insert with check (true);

-- Brand monitors: users own theirs
create policy "Users can manage own brand monitors"
  on brand_monitors for all
  using (auth.uid() = user_id);

-- ─── REALTIME ──────────────────────────────────────────────────────────────
-- Enable realtime for scrape_jobs so frontend can subscribe to progress
alter publication supabase_realtime add table scrape_jobs;

-- ─── MIGRATIONS ───────────────────────────────────────────────────────────────
-- Run these if upgrading an existing installation
alter table ads add column if not exists industry      text;
alter table ads add column if not exists country_code  text;
alter table ads add column if not exists creatives_count int;

create index if not exists ads_industry_idx     on ads(industry);
create index if not exists ads_country_code_idx on ads(country_code);
create index if not exists ads_score_desc_idx   on ads(performance_score desc nulls last);
