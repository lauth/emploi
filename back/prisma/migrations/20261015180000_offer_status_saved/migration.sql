-- Offers spotted but not applied to yet (adrs/0025-offer-status-saved.md).
-- Written by hand: Prisma would add the value last, and sorting by status
-- follows the declaration order of the enum (adrs/0022-offer-status.md).
ALTER TYPE "offer_status" ADD VALUE 'saved' BEFORE 'applied';
