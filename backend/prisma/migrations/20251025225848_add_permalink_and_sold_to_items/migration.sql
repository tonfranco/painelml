-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "permalink" TEXT,
ADD COLUMN     "sold" INTEGER NOT NULL DEFAULT 0;
