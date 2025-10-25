/*
  Warnings:

  - You are about to drop the column `attempts` on the `WebhookEvent` table. All the data in the column will be lost.
  - Changed the type of `payload` on the `WebhookEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "public"."WebhookEvent_eventId_idx";

-- AlterTable
ALTER TABLE "WebhookEvent" DROP COLUMN "attempts",
DROP COLUMN "payload",
ADD COLUMN     "payload" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "syncInterval" INTEGER NOT NULL DEFAULT 30,
    "syncItems" BOOLEAN NOT NULL DEFAULT true,
    "syncOrders" BOOLEAN NOT NULL DEFAULT true,
    "syncQuestions" BOOLEAN NOT NULL DEFAULT true,
    "syncHistoryDays" INTEGER NOT NULL DEFAULT 30,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewQuestions" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewOrders" BOOLEAN NOT NULL DEFAULT true,
    "notifyLowStock" BOOLEAN NOT NULL DEFAULT true,
    "notifyQuestionsSLA" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_accountId_key" ON "Settings"("accountId");

-- CreateIndex
CREATE INDEX "Settings_accountId_idx" ON "Settings"("accountId");

-- CreateIndex
CREATE INDEX "WebhookEvent_userId_idx" ON "WebhookEvent"("userId");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
