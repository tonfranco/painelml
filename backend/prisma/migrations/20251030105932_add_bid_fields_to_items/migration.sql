-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "buying_mode" TEXT,
ADD COLUMN     "has_bids" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listing_type_id" TEXT;
