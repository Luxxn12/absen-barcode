-- CreateEnum
CREATE TYPE "ForumMood" AS ENUM ('Senang', 'Netral', 'Sedih', 'PerluPerhatian');

-- CreateTable
CREATE TABLE "ForumEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mood" "ForumMood" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumEntry_createdAt_idx" ON "ForumEntry"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ForumEntry" ADD CONSTRAINT "ForumEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
