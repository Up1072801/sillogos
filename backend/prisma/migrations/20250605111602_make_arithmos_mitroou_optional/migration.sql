-- DropIndex
DROP INDEX "EksoterikoMelos_arithmos_mitroou_key";

-- DropIndex
DROP INDEX "EsoterikoMelos_arithmos_mitroou_key";

-- AlterTable
ALTER TABLE "EksoterikoMelos" ALTER COLUMN "arithmos_mitroou" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EsoterikoMelos" ALTER COLUMN "arithmos_mitroou" DROP NOT NULL;
