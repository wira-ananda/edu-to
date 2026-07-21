/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,name]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TryoutStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEACHER';

-- DropIndex
DROP INDEX "Subject_name_key";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Tryout" ADD COLUMN     "maxAttempts" INTEGER DEFAULT 1,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "status" "TryoutStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "TryoutSession" ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Answers_sessionId_idx" ON "Answers"("sessionId");

-- CreateIndex
CREATE INDEX "Answers_questionId_idx" ON "Answers"("questionId");

-- CreateIndex
CREATE INDEX "Question_ownerId_idx" ON "Question"("ownerId");

-- CreateIndex
CREATE INDEX "Question_weightPriority_idx" ON "Question"("weightPriority");

-- CreateIndex
CREATE INDEX "Subject_ownerId_idx" ON "Subject"("ownerId");

-- CreateIndex
CREATE INDEX "Subject_name_idx" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_ownerId_name_key" ON "Subject"("ownerId", "name");

-- CreateIndex
CREATE INDEX "Tryout_subjectId_idx" ON "Tryout"("subjectId");

-- CreateIndex
CREATE INDEX "Tryout_ownerId_idx" ON "Tryout"("ownerId");

-- CreateIndex
CREATE INDEX "Tryout_status_idx" ON "Tryout"("status");

-- CreateIndex
CREATE INDEX "TryoutSession_userId_idx" ON "TryoutSession"("userId");

-- CreateIndex
CREATE INDEX "TryoutSession_tryoutId_idx" ON "TryoutSession"("tryoutId");

-- CreateIndex
CREATE INDEX "TryoutSession_status_idx" ON "TryoutSession"("status");

-- CreateIndex
CREATE INDEX "TryoutSession_userId_tryoutId_idx" ON "TryoutSession"("userId", "tryoutId");

-- CreateIndex
CREATE INDEX "TryoutSession_userId_tryoutId_attemptNumber_idx" ON "TryoutSession"("userId", "tryoutId", "attemptNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "WrsLog_sessionId_idx" ON "WrsLog"("sessionId");

-- CreateIndex
CREATE INDEX "WrsLog_questionId_idx" ON "WrsLog"("questionId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tryout" ADD CONSTRAINT "Tryout_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
