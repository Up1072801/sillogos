/*
  Warnings:

  - Added the required column `id_vathmou_diskolias` to the `Melos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Melos" ADD COLUMN     "id_vathmou_diskolias" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Melos" ADD CONSTRAINT "Melos_id_vathmou_diskolias_fkey" FOREIGN KEY ("id_vathmou_diskolias") REFERENCES "VathmosDiskolias"("id_vathmou_diskolias") ON DELETE RESTRICT ON UPDATE CASCADE;
