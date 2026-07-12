-- AssetFlow database-level rules Prisma cannot express.
-- Run after every fresh migrate:  npm run db:constraints
-- Safe to re-run (idempotent).

-- RULE 1: an asset can have only ONE active (un-returned) allocation.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_allocation
  ON allocations (asset_id)
  WHERE returned_at IS NULL;

-- Asset tag sequence (AF-0001 ...). Seed data uses AF-0001..AF-0099,
-- so app-generated tags start at AF-0101 (seed script calls setval).
CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 101;

-- RULE 2: no overlapping bookings for the same resource.
-- Half-open range [start, end) means back-to-back bookings are ALLOWED
-- (10:00-11:00 right after 9:00-10:00 is fine), true overlaps are rejected
-- by PostgreSQL itself with error code 23P01 (exclusion_violation).
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  ALTER TABLE bookings
    ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING gist (
      asset_id WITH =,
      tstzrange(start_ts, end_ts, '[)') WITH &&
    )
    WHERE (status <> 'cancelled');
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;
