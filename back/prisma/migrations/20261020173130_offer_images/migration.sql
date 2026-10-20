-- CreateTable
CREATE TABLE "offer_images" (
    "offer_id" UUID NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "offer_images_pkey" PRIMARY KEY ("offer_id")
);

-- AddForeignKey
ALTER TABLE "offer_images" ADD CONSTRAINT "offer_images_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
