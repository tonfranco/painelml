-- CreateTable
CREATE TABLE "BillingPayment" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "creditNoteNumber" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "paymentTypeDescription" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentMethodDescription" TEXT,
    "paymentStatus" TEXT NOT NULL,
    "paymentStatusDescription" TEXT,
    "paymentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountInThisPeriod" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountInOtherPeriod" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingPayment_accountId_idx" ON "BillingPayment"("accountId");

-- CreateIndex
CREATE INDEX "BillingPayment_paymentId_idx" ON "BillingPayment"("paymentId");

-- CreateIndex
CREATE INDEX "BillingPayment_paymentDate_idx" ON "BillingPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "BillingPayment_paymentStatus_idx" ON "BillingPayment"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPayment_periodId_paymentId_key" ON "BillingPayment"("periodId", "paymentId");

-- AddForeignKey
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "BillingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
