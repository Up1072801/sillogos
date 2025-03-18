/*
  Warnings:

  - The primary key for the `Daneizetai` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Eksoflei` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Katavalei` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Plironei` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Daneizetai" DROP CONSTRAINT "Daneizetai_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Daneizetai_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Eksoflei" DROP CONSTRAINT "Eksoflei_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Eksoflei_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Katavalei" DROP CONSTRAINT "Katavalei_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Katavalei_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Plironei" DROP CONSTRAINT "Plironei_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Plironei_pkey" PRIMARY KEY ("id");
