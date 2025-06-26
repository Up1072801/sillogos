-- DropForeignKey
ALTER TABLE "Simmetoxi" DROP CONSTRAINT "Simmetoxi_id_drastiriotitas_fkey";

-- AddForeignKey
ALTER TABLE "Simmetoxi" ADD CONSTRAINT "Simmetoxi_id_drastiriotitas_fkey" FOREIGN KEY ("id_drastiriotitas") REFERENCES "Drastiriotita"("id_drastiriotitas") ON DELETE SET NULL ON UPDATE CASCADE;
