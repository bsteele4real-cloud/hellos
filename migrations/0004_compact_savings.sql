-- Remember how many tokens a shorten credited, so undo can reverse that credit.
alter table helix_memory add column if not exists compact_saved integer not null default 0;
alter table helix_memory add column if not exists compacted_on date;
