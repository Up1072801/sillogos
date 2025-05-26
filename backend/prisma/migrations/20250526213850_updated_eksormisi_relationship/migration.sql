/*
  Warnings:

  - You are about to drop the column `id_ypefthynou` on the `Eksormisi` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Eksormisi" DROP CONSTRAINT "Eksormisi_id_ypefthynou_fkey";

-- AlterTable
ALTER TABLE "Eksormisi" DROP COLUMN "id_ypefthynou";

-- CreateTable
CREATE TABLE "YpefthynoiEksormisis" (
    "id_eksormisis" INTEGER NOT NULL,
    "id_ypefthynou" INTEGER NOT NULL,

    CONSTRAINT "YpefthynoiEksormisis_pkey" PRIMARY KEY ("id_eksormisis","id_ypefthynou")
);

-- AddForeignKey
ALTER TABLE "YpefthynoiEksormisis" ADD CONSTRAINT "YpefthynoiEksormisis_id_eksormisis_fkey" FOREIGN KEY ("id_eksormisis") REFERENCES "Eksormisi"("id_eksormisis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YpefthynoiEksormisis" ADD CONSTRAINT "YpefthynoiEksormisis_id_ypefthynou_fkey" FOREIGN KEY ("id_ypefthynou") REFERENCES "EsoterikoMelos"("id_melous") ON DELETE CASCADE ON UPDATE CASCADE;
