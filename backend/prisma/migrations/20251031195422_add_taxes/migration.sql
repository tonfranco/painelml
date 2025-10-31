-- CreateTable
CREATE TABLE "Tax" (
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

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tax_accountId_idx" ON "Tax"("accountId");

-- CreateIndex
CREATE INDEX "Tax_category_idx" ON "Tax"("category");

-- CreateIndex
CREATE INDEX "Tax_isActive_idx" ON "Tax"("isActive");

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
