-- CreateTable
CREATE TABLE "ExtraRevenue" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtraRevenue_accountId_idx" ON "ExtraRevenue"("accountId");

-- CreateIndex
CREATE INDEX "ExtraRevenue_category_idx" ON "ExtraRevenue"("category");

-- CreateIndex
CREATE INDEX "ExtraRevenue_isActive_idx" ON "ExtraRevenue"("isActive");

-- AddForeignKey
ALTER TABLE "ExtraRevenue" ADD CONSTRAINT "ExtraRevenue_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
