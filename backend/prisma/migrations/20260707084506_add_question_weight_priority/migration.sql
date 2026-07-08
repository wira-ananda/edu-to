-- CreateEnum
CREATE TYPE "WeightPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'VERY_HIGH');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "weightPriority" "WeightPriority" NOT NULL DEFAULT 'NORMAL',
ALTER COLUMN "weight" SET DEFAULT 3;

-- CreateIndex
CREATE INDEX "Question_subjectId_idx" ON "Question"("subjectId");

-- CreateIndex
CREATE INDEX "Question_difficultyLevel_idx" ON "Question"("difficultyLevel");

-- CreateIndex
CREATE INDEX "Question_subjectId_difficultyLevel_idx" ON "Question"("subjectId", "difficultyLevel");
