-- AlterTable
ALTER TABLE "Daneizetai" ADD COLUMN     "katastasi_daneismou" TEXT;

-- AlterTable
ALTER TABLE "Eksormisi" ADD COLUMN     "id_ypefthynou" INTEGER;

-- AddForeignKey
ALTER TABLE "Eksormisi" ADD CONSTRAINT "Eksormisi_id_ypefthynou_fkey" FOREIGN KEY ("id_ypefthynou") REFERENCES "EsoterikoMelos"("id_melous") ON DELETE SET NULL ON UPDATE CASCADE;
