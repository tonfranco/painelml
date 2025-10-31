-- CreateTable
CREATE TABLE "BillingPeriod" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "periodStatus" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unpaidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feesAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCharge" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "chargeType" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "chargeDate" TIMESTAMP(3) NOT NULL,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingPeriod_accountId_idx" ON "BillingPeriod"("accountId");

-- CreateIndex
CREATE INDEX "BillingPeriod_periodKey_idx" ON "BillingPeriod"("periodKey");

-- CreateIndex
CREATE INDEX "BillingPeriod_periodStatus_idx" ON "BillingPeriod"("periodStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPeriod_accountId_periodKey_key" ON "BillingPeriod"("accountId", "periodKey");

-- CreateIndex
CREATE INDEX "BillingCharge_periodId_idx" ON "BillingCharge"("periodId");

-- CreateIndex
CREATE INDEX "BillingCharge_accountId_idx" ON "BillingCharge"("accountId");

-- CreateIndex
CREATE INDEX "BillingCharge_chargeType_idx" ON "BillingCharge"("chargeType");

-- CreateIndex
CREATE INDEX "BillingCharge_chargeDate_idx" ON "BillingCharge"("chargeDate");

-- AddForeignKey
ALTER TABLE "BillingPeriod" ADD CONSTRAINT "BillingPeriod_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCharge" ADD CONSTRAINT "BillingCharge_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "BillingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
