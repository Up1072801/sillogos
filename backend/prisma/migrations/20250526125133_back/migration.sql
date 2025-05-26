/*
  Warnings:

  - You are about to drop the column `poso` on the `EidosSindromis` table. All the data in the column will be lost.
  - You are about to drop the column `tipos` on the `EidosSindromis` table. All the data in the column will be lost.
  - You are about to drop the column `timh_melos` on the `Katafigio` table. All the data in the column will be lost.
  - You are about to drop the column `timh_mi_melos` on the `Katafigio` table. All the data in the column will be lost.
  - You are about to drop the column `topothesia` on the `Katafigio` table. All the data in the column will be lost.
  - You are about to drop the column `xwritikotita` on the `Katafigio` table. All the data in the column will be lost.
  - The primary key for the `Kratisi_Katafigiou` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Kratisi_Katafigiou` table. All the data in the column will be lost.
  - You are about to drop the column `id_eksormisis` on the `Simmetoxi` table. All the data in the column will be lost.
  - You are about to drop the column `perigrafi` on the `Sxoli` table. All the data in the column will be lost.
  - You are about to drop the column `titlos` on the `Sxoli` table. All the data in the column will be lost.
  - You are about to drop the column `perigrafi` on the `VathmosDiskolias` table. All the data in the column will be lost.
  - You are about to drop the `Agwnizontai` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Askeisi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SimmetoxiDrastiriotita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sindromis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sindromitos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Agwnizontai" DROP CONSTRAINT "Agwnizontai_id_agona_fkey";

-- DropForeignKey
ALTER TABLE "Agwnizontai" DROP CONSTRAINT "Agwnizontai_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Askeisi" DROP CONSTRAINT "Askeisi_id_athlimatos_fkey";

-- DropForeignKey
ALTER TABLE "Askeisi" DROP CONSTRAINT "Askeisi_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Eksoflei" DROP CONSTRAINT "Eksoflei_id_kratisis_fkey";

-- DropForeignKey
ALTER TABLE "Simmetoxi" DROP CONSTRAINT "Simmetoxi_id_eksormisis_fkey";

-- DropForeignKey
ALTER TABLE "SimmetoxiDrastiriotita" DROP CONSTRAINT "SimmetoxiDrastiriotita_id_drastiriotitas_fkey";

-- DropForeignKey
ALTER TABLE "SimmetoxiDrastiriotita" DROP CONSTRAINT "SimmetoxiDrastiriotita_id_simmetoxis_fkey";

-- DropForeignKey
ALTER TABLE "Sindromis" DROP CONSTRAINT "Sindromis_id_eidous_sindromis_fkey";

-- DropForeignKey
ALTER TABLE "Sindromitos" DROP CONSTRAINT "Sindromitos_id_sindromis_fkey";

-- DropForeignKey
ALTER TABLE "Sindromitos" DROP CONSTRAINT "Sindromitos_id_sindromiti_fkey";

-- AlterTable
ALTER TABLE "Agones" ALTER COLUMN "id_athlimatos" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EidosSindromis" DROP COLUMN "poso",
DROP COLUMN "tipos",
ADD COLUMN     "timi" INTEGER,
ADD COLUMN     "titlos" TEXT;

-- AlterTable
ALTER TABLE "Ekpaideutis" ADD COLUMN     "epipedo" TEXT,
ADD COLUMN     "klados" TEXT;

-- AlterTable
ALTER TABLE "Katafigio" DROP COLUMN "timh_melos",
DROP COLUMN "timh_mi_melos",
DROP COLUMN "topothesia",
DROP COLUMN "xwritikotita",
ADD COLUMN     "timi_eksoxwrou_melos" INTEGER,
ADD COLUMN     "timi_eksoxwroy_mimelos" INTEGER,
ADD COLUMN     "timi_melous" INTEGER,
ADD COLUMN     "timi_mi_melous" INTEGER,
ADD COLUMN     "xoritikotita" INTEGER;

-- AlterTable
ALTER TABLE "Kratisi_Katafigiou" DROP CONSTRAINT "Kratisi_Katafigiou_pkey",
DROP COLUMN "id",
ADD COLUMN     "id_kratisis" SERIAL NOT NULL,
ADD CONSTRAINT "Kratisi_Katafigiou_pkey" PRIMARY KEY ("id_kratisis");

-- AlterTable
ALTER TABLE "Simmetoxi" DROP COLUMN "id_eksormisis",
ADD COLUMN     "id_drastiriotitas" INTEGER;

-- AlterTable
ALTER TABLE "Sxoli" DROP COLUMN "perigrafi",
DROP COLUMN "titlos",
ADD COLUMN     "epipedo" TEXT,
ADD COLUMN     "etos" INTEGER,
ADD COLUMN     "klados" TEXT,
ADD COLUMN     "seira" INTEGER,
ADD COLUMN     "topothesies" JSONB;

-- AlterTable
ALTER TABLE "VathmosDiskolias" DROP COLUMN "perigrafi";

-- DropTable
DROP TABLE "Agwnizontai";

-- DropTable
DROP TABLE "Askeisi";

-- DropTable
DROP TABLE "SimmetoxiDrastiriotita";

-- DropTable
DROP TABLE "Sindromis";

-- DropTable
DROP TABLE "Sindromitos";

-- CreateTable
CREATE TABLE "Sindromi" (
    "id_sindromis" SERIAL NOT NULL,
    "hmerominia_enarksis" TIMESTAMP(3),
    "id_eidous_sindromis" INTEGER,

    CONSTRAINT "Sindromi_pkey" PRIMARY KEY ("id_sindromis")
);

-- CreateTable
CREATE TABLE "Exei" (
    "id_sindromiti" INTEGER NOT NULL,
    "id_sindromis" INTEGER NOT NULL,
    "hmerominia_pliromis" TIMESTAMP(3),

    CONSTRAINT "Exei_pkey" PRIMARY KEY ("id_sindromiti","id_sindromis")
);

-- CreateTable
CREATE TABLE "Asxoleitai" (
    "id_athliti" INTEGER NOT NULL,
    "id_athlimatos" INTEGER NOT NULL,

    CONSTRAINT "Asxoleitai_pkey" PRIMARY KEY ("id_athliti","id_athlimatos")
);

-- CreateTable
CREATE TABLE "Agonizetai" (
    "id_athliti" INTEGER NOT NULL,
    "id_agona" INTEGER NOT NULL,

    CONSTRAINT "Agonizetai_pkey" PRIMARY KEY ("id_athliti","id_agona")
);

-- AddForeignKey
ALTER TABLE "Sindromi" ADD CONSTRAINT "Sindromi_id_eidous_sindromis_fkey" FOREIGN KEY ("id_eidous_sindromis") REFERENCES "EidosSindromis"("id_eidous_sindromis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eksoflei" ADD CONSTRAINT "Eksoflei_id_kratisis_fkey" FOREIGN KEY ("id_kratisis") REFERENCES "Kratisi_Katafigiou"("id_kratisis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simmetoxi" ADD CONSTRAINT "Simmetoxi_id_drastiriotitas_fkey" FOREIGN KEY ("id_drastiriotitas") REFERENCES "Drastiriotita"("id_drastiriotitas") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exei" ADD CONSTRAINT "Exei_id_sindromis_fkey" FOREIGN KEY ("id_sindromis") REFERENCES "Sindromi"("id_sindromis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exei" ADD CONSTRAINT "Exei_id_sindromiti_fkey" FOREIGN KEY ("id_sindromiti") REFERENCES "Sindromitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asxoleitai" ADD CONSTRAINT "Asxoleitai_id_athlimatos_fkey" FOREIGN KEY ("id_athlimatos") REFERENCES "Athlima"("id_athlimatos") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asxoleitai" ADD CONSTRAINT "Asxoleitai_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agonizetai" ADD CONSTRAINT "Agonizetai_id_agona_fkey" FOREIGN KEY ("id_agona") REFERENCES "Agones"("id_agona") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agonizetai" ADD CONSTRAINT "Agonizetai_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;
