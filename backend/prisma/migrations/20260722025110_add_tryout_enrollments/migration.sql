-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TryoutEnrollment" (
    "id" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryoutEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TryoutEnrollment_tryoutId_idx" ON "TryoutEnrollment"("tryoutId");

-- CreateIndex
CREATE INDEX "TryoutEnrollment_studentId_idx" ON "TryoutEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "TryoutEnrollment_status_idx" ON "TryoutEnrollment"("status");

-- CreateIndex
CREATE INDEX "TryoutEnrollment_tryoutId_status_idx" ON "TryoutEnrollment"("tryoutId", "status");

-- CreateIndex
CREATE INDEX "TryoutEnrollment_studentId_status_idx" ON "TryoutEnrollment"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TryoutEnrollment_tryoutId_studentId_key" ON "TryoutEnrollment"("tryoutId", "studentId");

-- AddForeignKey
ALTER TABLE "TryoutEnrollment" ADD CONSTRAINT "TryoutEnrollment_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutEnrollment" ADD CONSTRAINT "TryoutEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
