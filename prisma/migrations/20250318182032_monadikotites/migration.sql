/*
  Warnings:

  - You are about to drop the `Ekpaideutis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ekpaideutis" DROP CONSTRAINT "Ekpaideutis_id_epafis_fkey";

-- DropTable
DROP TABLE "Ekpaideutis";
