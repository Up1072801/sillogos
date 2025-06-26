/*
  Warnings:

  - You are about to drop the column `timi` on the `EidosSindromis` table. All the data in the column will be lost.
  - You are about to drop the column `titlos` on the `EidosSindromis` table. All the data in the column will be lost.
  - You are about to drop the column `epipedo` on the `Ekpaideutis` table. All the data in the column will be lost.
  - You are about to drop the column `klados` on the `Ekpaideutis` table. All the data in the column will be lost.
  - You are about to drop the column `timi_eksoxwrou_melos` on the `Katafigio` table. All the data in the column will be lost.
  - You are about to drop the column `timi_eksoxwroy_mimelos` on the `Katafigio` table. All the data in the column will be lost.
  - You are about to drop the column `timi_melous` on the `Katafigio` table. All the data in the column will be lost.
  - You are about to drop the column `timi_mi_melous` on the `Katafigio` table. All the data in the column will be lost.
  - You are about to drop the column `xoritikotita` on the `Katafigio` table. All the data in the column will be lost.
  - The primary key for the `Kratisi_Katafigiou` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_kratisis` on the `Kratisi_Katafigiou` table. All the data in the column will be lost.
  - You are about to drop the column `id_drastiriotitas` on the `Simmetoxi` table. All the data in the column will be lost.
  - You are about to drop the column `epipedo` on the `Sxoli` table. All the data in the column will be lost.
  - You are about to drop the column `etos` on the `Sxoli` table. All the data in the column will be lost.
  - You are about to drop the column `klados` on the `Sxoli` table. All the data in the column will be lost.
  - You are about to drop the column `seira` on the `Sxoli` table. All the data in the column will be lost.
  - You are about to drop the column `topothesies` on the `Sxoli` table. All the data in the column will be lost.
  - You are about to drop the `Agonizetai` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Asxoleitai` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Exei` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sindromi` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `id_athlimatos` on table `Agones` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `id_eksormisis` to the `Simmetoxi` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Agonizetai" DROP CONSTRAINT "Agonizetai_id_agona_fkey";

-- DropForeignKey
ALTER TABLE "Agonizetai" DROP CONSTRAINT "Agonizetai_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Asxoleitai" DROP CONSTRAINT "Asxoleitai_id_athlimatos_fkey";

-- DropForeignKey
ALTER TABLE "Asxoleitai" DROP CONSTRAINT "Asxoleitai_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Eksoflei" DROP CONSTRAINT "Eksoflei_id_kratisis_fkey";

-- DropForeignKey
ALTER TABLE "Exei" DROP CONSTRAINT "Exei_id_sindromis_fkey";

-- DropForeignKey
ALTER TABLE "Exei" DROP CONSTRAINT "Exei_id_sindromiti_fkey";

-- DropForeignKey
ALTER TABLE "Simmetoxi" DROP CONSTRAINT "Simmetoxi_id_drastiriotitas_fkey";

-- DropForeignKey
ALTER TABLE "Sindromi" DROP CONSTRAINT "Sindromi_id_eidous_sindromis_fkey";

-- AlterTable
ALTER TABLE "Agones" ALTER COLUMN "id_athlimatos" SET NOT NULL;

-- AlterTable
ALTER TABLE "EidosSindromis" DROP COLUMN "timi",
DROP COLUMN "titlos",
ADD COLUMN     "poso" INTEGER,
ADD COLUMN     "tipos" TEXT;

-- AlterTable
ALTER TABLE "Ekpaideutis" DROP COLUMN "epipedo",
DROP COLUMN "klados";

-- AlterTable
ALTER TABLE "Katafigio" DROP COLUMN "timi_eksoxwrou_melos",
DROP COLUMN "timi_eksoxwroy_mimelos",
DROP COLUMN "timi_melous",
DROP COLUMN "timi_mi_melous",
DROP COLUMN "xoritikotita",
ADD COLUMN     "timh_melos" INTEGER,
ADD COLUMN     "timh_mi_melos" INTEGER,
ADD COLUMN     "topothesia" TEXT,
ADD COLUMN     "xwritikotita" INTEGER;

-- AlterTable
ALTER TABLE "Kratisi_Katafigiou" DROP CONSTRAINT "Kratisi_Katafigiou_pkey",
DROP COLUMN "id_kratisis",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Kratisi_Katafigiou_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Simmetoxi" DROP COLUMN "id_drastiriotitas",
ADD COLUMN     "id_eksormisis" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Sxoli" DROP COLUMN "epipedo",
DROP COLUMN "etos",
DROP COLUMN "klados",
DROP COLUMN "seira",
DROP COLUMN "topothesies",
ADD COLUMN     "perigrafi" TEXT,
ADD COLUMN     "titlos" TEXT;

-- AlterTable
ALTER TABLE "VathmosDiskolias" ADD COLUMN     "perigrafi" TEXT;

-- DropTable
DROP TABLE "Agonizetai";

-- DropTable
DROP TABLE "Asxoleitai";

-- DropTable
DROP TABLE "Exei";

-- DropTable
DROP TABLE "Sindromi";

-- CreateTable
CREATE TABLE "SimmetoxiDrastiriotita" (
    "id_simmetoxis" INTEGER NOT NULL,
    "id_drastiriotitas" INTEGER NOT NULL,
    "hmerominia_eggrafis" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimmetoxiDrastiriotita_pkey" PRIMARY KEY ("id_simmetoxis","id_drastiriotitas")
);

-- CreateTable
CREATE TABLE "Sindromis" (
    "id_sindromis" SERIAL NOT NULL,
    "id_eidous_sindromis" INTEGER,
    "hmerominia_enarksis" TIMESTAMP(3),

    CONSTRAINT "Sindromis_pkey" PRIMARY KEY ("id_sindromis")
);

-- CreateTable
CREATE TABLE "Sindromitos" (
    "id_sindromitis" SERIAL NOT NULL,
    "id_sindromiti" INTEGER NOT NULL,
    "id_sindromis" INTEGER NOT NULL,
    "hmerominia_pliromis" TIMESTAMP(3),

    CONSTRAINT "Sindromitos_pkey" PRIMARY KEY ("id_sindromitis")
);

-- CreateTable
CREATE TABLE "Askeisi" (
    "id_athliti" INTEGER NOT NULL,
    "id_athlimatos" INTEGER NOT NULL,

    CONSTRAINT "Askeisi_pkey" PRIMARY KEY ("id_athliti","id_athlimatos")
);

-- CreateTable
CREATE TABLE "Agwnizontai" (
    "id_athliti" INTEGER NOT NULL,
    "id_agona" INTEGER NOT NULL,

    CONSTRAINT "Agwnizontai_pkey" PRIMARY KEY ("id_athliti","id_agona")
);

-- AddForeignKey
ALTER TABLE "Simmetoxi" ADD CONSTRAINT "Simmetoxi_id_eksormisis_fkey" FOREIGN KEY ("id_eksormisis") REFERENCES "Eksormisi"("id_eksormisis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimmetoxiDrastiriotita" ADD CONSTRAINT "SimmetoxiDrastiriotita_id_simmetoxis_fkey" FOREIGN KEY ("id_simmetoxis") REFERENCES "Simmetoxi"("id_simmetoxis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimmetoxiDrastiriotita" ADD CONSTRAINT "SimmetoxiDrastiriotita_id_drastiriotitas_fkey" FOREIGN KEY ("id_drastiriotitas") REFERENCES "Drastiriotita"("id_drastiriotitas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sindromis" ADD CONSTRAINT "Sindromis_id_eidous_sindromis_fkey" FOREIGN KEY ("id_eidous_sindromis") REFERENCES "EidosSindromis"("id_eidous_sindromis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sindromitos" ADD CONSTRAINT "Sindromitos_id_sindromiti_fkey" FOREIGN KEY ("id_sindromiti") REFERENCES "Sindromitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sindromitos" ADD CONSTRAINT "Sindromitos_id_sindromis_fkey" FOREIGN KEY ("id_sindromis") REFERENCES "Sindromis"("id_sindromis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eksoflei" ADD CONSTRAINT "Eksoflei_id_kratisis_fkey" FOREIGN KEY ("id_kratisis") REFERENCES "Kratisi_Katafigiou"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Askeisi" ADD CONSTRAINT "Askeisi_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Askeisi" ADD CONSTRAINT "Askeisi_id_athlimatos_fkey" FOREIGN KEY ("id_athlimatos") REFERENCES "Athlima"("id_athlimatos") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agwnizontai" ADD CONSTRAINT "Agwnizontai_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agwnizontai" ADD CONSTRAINT "Agwnizontai_id_agona_fkey" FOREIGN KEY ("id_agona") REFERENCES "Agones"("id_agona") ON DELETE CASCADE ON UPDATE CASCADE;
