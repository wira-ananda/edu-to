/*
  Warnings:

  - A unique constraint covering the columns `[joinCode]` on the table `Tryout` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tryout" ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "joinCodeEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Tryout_joinCode_key" ON "Tryout"("joinCode");

-- CreateIndex
CREATE INDEX "Tryout_joinCodeEnabled_idx" ON "Tryout"("joinCodeEnabled");
