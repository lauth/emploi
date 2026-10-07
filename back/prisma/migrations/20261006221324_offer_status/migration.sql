-- CreateEnum
CREATE TYPE "offer_status" AS ENUM ('applied', 'interviewing', 'offered', 'accepted', 'rejected', 'ghosted', 'withdrawn');

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "status" "offer_status" NOT NULL DEFAULT 'applied';
