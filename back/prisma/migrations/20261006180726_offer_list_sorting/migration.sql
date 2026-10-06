-- CreateIndex
CREATE INDEX "offers_applied_at_created_at_id_idx" ON "offers"("applied_at" DESC, "created_at" DESC, "id" DESC);

-- Hand-written (adrs/0020-offer-list-filters-sorting-and-pagination.md): sort
-- text with ICU, case- and accent-aware ("Alpha < beta < éco < Zèbre"); the
-- database's default libc collation puts capitals first and accents after z.
-- Prisma can't express collations and doesn't track them, so it sees no drift.
ALTER TABLE "offers" ALTER COLUMN "title" TYPE VARCHAR(200) COLLATE "und-x-icu";
ALTER TABLE "offers" ALTER COLUMN "company" TYPE VARCHAR(200) COLLATE "und-x-icu";
