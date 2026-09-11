/*
  Warnings:

  - You are about to drop the column `sentiment` on the `Complaint` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Complaint" DROP COLUMN "sentiment";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "name" TEXT;
