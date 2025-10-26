-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "deliveryFinal" TIMESTAMP(3),
ADD COLUMN     "deliveryLimit" TIMESTAMP(3),
ADD COLUMN     "handlingLimit" TIMESTAMP(3),
ADD COLUMN     "slaExpectedDate" TIMESTAMP(3),
ADD COLUMN     "slaLastUpdated" TIMESTAMP(3),
ADD COLUMN     "slaService" TEXT,
ADD COLUMN     "slaStatus" TEXT;

-- CreateIndex
CREATE INDEX "Shipment_slaExpectedDate_idx" ON "Shipment"("slaExpectedDate");

-- CreateIndex
CREATE INDEX "Shipment_slaStatus_idx" ON "Shipment"("slaStatus");
