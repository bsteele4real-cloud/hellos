-- Keep the pre-compact note so a shorten can be undone.
alter table helix_memory add column if not exists previous_body text;
