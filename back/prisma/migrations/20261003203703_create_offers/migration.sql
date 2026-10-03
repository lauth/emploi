-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "company" VARCHAR(200) NOT NULL,
    "url" VARCHAR(2048),
    "location" VARCHAR(200),
    "description" TEXT,
    "applied_at" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offers_created_at_id_idx" ON "offers"("created_at" DESC, "id" DESC);
