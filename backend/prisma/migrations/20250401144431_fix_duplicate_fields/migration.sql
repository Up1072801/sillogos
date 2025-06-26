/*
  Warnings:

  - The primary key for the `Athlitis` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_athliti` on the `Athlitis` table. All the data in the column will be lost.
  - The primary key for the `Ekpaideutis` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_ekpaideuti` on the `Ekpaideutis` table. All the data in the column will be lost.
  - The primary key for the `EksoterikoMelos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_ekso_melous` on the `EksoterikoMelos` table. All the data in the column will be lost.
  - The primary key for the `EsoterikoMelos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_es_melous` on the `EsoterikoMelos` table. All the data in the column will be lost.
  - The primary key for the `Melos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_melous` on the `Melos` table. All the data in the column will be lost.
  - The primary key for the `Sindromitis` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_sindromiti` on the `Sindromitis` table. All the data in the column will be lost.
  - Added the required column `id_epafis` to the `Ekpaideutis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_epafis` to the `Melos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Agonizetai" DROP CONSTRAINT "Agonizetai_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Asxoleitai" DROP CONSTRAINT "Asxoleitai_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Athlitis" DROP CONSTRAINT "Athlitis_id_es_melous_fkey";

-- DropForeignKey
ALTER TABLE "Ekpaideuei" DROP CONSTRAINT "Ekpaideuei_id_ekpaideuti_fkey";

-- DropForeignKey
ALTER TABLE "Ekpaideutis" DROP CONSTRAINT "Ekpaideutis_id_ekpaideuti_fkey";

-- DropForeignKey
ALTER TABLE "EksoterikoMelos" DROP CONSTRAINT "EksoterikoMelos_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "EsoterikoMelos" DROP CONSTRAINT "EsoterikoMelos_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Exei" DROP CONSTRAINT "Exei_id_sindromiti_fkey";

-- DropForeignKey
ALTER TABLE "Katavalei" DROP CONSTRAINT "Katavalei_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Melos" DROP CONSTRAINT "Melos_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Parakolouthisi" DROP CONSTRAINT "Parakolouthisi_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Plironei" DROP CONSTRAINT "Plironei_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Simmetoxi" DROP CONSTRAINT "Simmetoxi_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Sindromitis" DROP CONSTRAINT "Sindromitis_id_es_melous_fkey";

-- DropIndex
DROP INDEX "Athlitis_id_es_melous_key";

-- DropIndex
DROP INDEX "EksoterikoMelos_id_melous_key";

-- DropIndex
DROP INDEX "EsoterikoMelos_id_melous_key";

-- DropIndex
DROP INDEX "Sindromitis_id_es_melous_key";

-- AlterTable
ALTER TABLE "Athlitis" DROP CONSTRAINT "Athlitis_pkey",
DROP COLUMN "id_athliti",
ADD CONSTRAINT "Athlitis_pkey" PRIMARY KEY ("id_es_melous");

-- AlterTable
ALTER TABLE "Ekpaideutis" DROP CONSTRAINT "Ekpaideutis_pkey",
DROP COLUMN "id_ekpaideuti",
ADD COLUMN     "id_epafis" INTEGER NOT NULL,
ADD CONSTRAINT "Ekpaideutis_pkey" PRIMARY KEY ("id_epafis");

-- AlterTable
ALTER TABLE "EksoterikoMelos" DROP CONSTRAINT "EksoterikoMelos_pkey",
DROP COLUMN "id_ekso_melous",
ADD CONSTRAINT "EksoterikoMelos_pkey" PRIMARY KEY ("id_melous");

-- AlterTable
ALTER TABLE "EsoterikoMelos" DROP CONSTRAINT "EsoterikoMelos_pkey",
DROP COLUMN "id_es_melous",
ADD CONSTRAINT "EsoterikoMelos_pkey" PRIMARY KEY ("id_melous");

-- AlterTable
ALTER TABLE "Melos" DROP CONSTRAINT "Melos_pkey",
DROP COLUMN "id_melous",
ADD COLUMN     "id_epafis" INTEGER NOT NULL,
ADD CONSTRAINT "Melos_pkey" PRIMARY KEY ("id_epafis");

-- AlterTable
ALTER TABLE "Sindromitis" DROP CONSTRAINT "Sindromitis_pkey",
DROP COLUMN "id_sindromiti",
ADD CONSTRAINT "Sindromitis_pkey" PRIMARY KEY ("id_es_melous");

-- AddForeignKey
ALTER TABLE "Melos" ADD CONSTRAINT "Melos_id_epafis_fkey" FOREIGN KEY ("id_epafis") REFERENCES "Epafes"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsoterikoMelos" ADD CONSTRAINT "EsoterikoMelos_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EksoterikoMelos" ADD CONSTRAINT "EksoterikoMelos_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlitis" ADD CONSTRAINT "Athlitis_id_es_melous_fkey" FOREIGN KEY ("id_es_melous") REFERENCES "EsoterikoMelos"("id_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sindromitis" ADD CONSTRAINT "Sindromitis_id_es_melous_fkey" FOREIGN KEY ("id_es_melous") REFERENCES "EsoterikoMelos"("id_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ekpaideutis" ADD CONSTRAINT "Ekpaideutis_id_epafis_fkey" FOREIGN KEY ("id_epafis") REFERENCES "Epafes"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ekpaideuei" ADD CONSTRAINT "Ekpaideuei_id_ekpaideuti_fkey" FOREIGN KEY ("id_ekpaideuti") REFERENCES "Ekpaideutis"("id_epafis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simmetoxi" ADD CONSTRAINT "Simmetoxi_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plironei" ADD CONSTRAINT "Plironei_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exei" ADD CONSTRAINT "Exei_id_sindromiti_fkey" FOREIGN KEY ("id_sindromiti") REFERENCES "Sindromitis"("id_es_melous") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asxoleitai" ADD CONSTRAINT "Asxoleitai_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agonizetai" ADD CONSTRAINT "Agonizetai_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parakolouthisi" ADD CONSTRAINT "Parakolouthisi_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Katavalei" ADD CONSTRAINT "Katavalei_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE RESTRICT ON UPDATE CASCADE;
