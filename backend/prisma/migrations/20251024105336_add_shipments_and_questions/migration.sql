-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "meliShipmentId" TEXT NOT NULL,
    "orderId" TEXT,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "substatus" TEXT,
    "trackingNumber" TEXT,
    "trackingMethod" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "shippedDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "receiverAddress" TEXT,
    "senderAddress" TEXT,
    "cost" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "meliQuestionId" TEXT NOT NULL,
    "itemId" TEXT,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "answer" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "dateAnswered" TIMESTAMP(3),
    "fromId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_meliShipmentId_key" ON "Shipment"("meliShipmentId");

-- CreateIndex
CREATE INDEX "Shipment_accountId_idx" ON "Shipment"("accountId");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Question_meliQuestionId_key" ON "Question"("meliQuestionId");

-- CreateIndex
CREATE INDEX "Question_accountId_idx" ON "Question"("accountId");

-- CreateIndex
CREATE INDEX "Question_itemId_idx" ON "Question"("itemId");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "Question_dateCreated_idx" ON "Question"("dateCreated");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
