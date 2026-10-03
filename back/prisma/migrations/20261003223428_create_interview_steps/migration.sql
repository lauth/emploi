-- CreateEnum
CREATE TYPE "interview_step_status" AS ENUM ('planned', 'pending', 'passed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "interview_steps" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "date" DATE,
    "status" "interview_step_status" NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "interview_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_steps_offer_id_position_idx" ON "interview_steps"("offer_id", "position");

-- AddForeignKey
ALTER TABLE "interview_steps" ADD CONSTRAINT "interview_steps_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
