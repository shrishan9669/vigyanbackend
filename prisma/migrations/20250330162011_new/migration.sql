/*
  Warnings:

  - A unique constraint covering the columns `[purchaseid]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Installment` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Purchase_number_key";

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "Installment" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_purchaseid_key" ON "Purchase"("purchaseid");
