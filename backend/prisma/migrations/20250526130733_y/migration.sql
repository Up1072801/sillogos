/*
  Warnings:

  - You are about to drop the column `id_drastiriotitas` on the `Simmetoxi` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Simmetoxi" DROP CONSTRAINT "Simmetoxi_id_drastiriotitas_fkey";

-- AlterTable
ALTER TABLE "Simmetoxi" DROP COLUMN "id_drastiriotitas",
ADD COLUMN     "id_eksormisis" INTEGER;

-- CreateTable
CREATE TABLE "Simmetoxi_Drastiriotita" (
    "id_simmetoxis" INTEGER NOT NULL,
    "id_drastiriotitas" INTEGER NOT NULL,

    CONSTRAINT "Simmetoxi_Drastiriotita_pkey" PRIMARY KEY ("id_simmetoxis","id_drastiriotitas")
);

-- AddForeignKey
ALTER TABLE "Simmetoxi" ADD CONSTRAINT "Simmetoxi_id_eksormisis_fkey" FOREIGN KEY ("id_eksormisis") REFERENCES "Eksormisi"("id_eksormisis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simmetoxi_Drastiriotita" ADD CONSTRAINT "Simmetoxi_Drastiriotita_id_simmetoxis_fkey" FOREIGN KEY ("id_simmetoxis") REFERENCES "Simmetoxi"("id_simmetoxis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simmetoxi_Drastiriotita" ADD CONSTRAINT "Simmetoxi_Drastiriotita_id_drastiriotitas_fkey" FOREIGN KEY ("id_drastiriotitas") REFERENCES "Drastiriotita"("id_drastiriotitas") ON DELETE CASCADE ON UPDATE CASCADE;
