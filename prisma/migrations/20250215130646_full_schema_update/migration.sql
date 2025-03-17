/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Epafes" (
    "id_epafis" SERIAL NOT NULL,
    "onoma" TEXT,
    "epitheto" TEXT,
    "patronimo" TEXT,
    "email" TEXT,
    "tilefono" INTEGER,

    CONSTRAINT "Epafes_pkey" PRIMARY KEY ("id_epafis")
);

-- CreateTable
CREATE TABLE "VathmosDiskolias" (
    "id_vathmou_diskolias" SERIAL NOT NULL,
    "epipedo" TEXT,
    "ores_poreias" INTEGER,
    "ipsometriki_diafora" INTEGER,
    "xioni" TEXT,
    "skini" TEXT,

    CONSTRAINT "VathmosDiskolias_pkey" PRIMARY KEY ("id_vathmou_diskolias")
);

-- CreateTable
CREATE TABLE "Eksormisi" (
    "id_eksormisis" SERIAL NOT NULL,
    "proorismos" TEXT,
    "timi" INTEGER,
    "imerominia_anaxorisis" TIMESTAMP(3),
    "imerominia_afiksis" TIMESTAMP(3),
    "titlos" TEXT,

    CONSTRAINT "Eksormisi_pkey" PRIMARY KEY ("id_eksormisis")
);

-- CreateTable
CREATE TABLE "Katafigio" (
    "id_katafigiou" SERIAL NOT NULL,
    "onoma" TEXT,
    "xoritikotita" INTEGER,
    "timi_melous" INTEGER,
    "timi_mi_melous" INTEGER,

    CONSTRAINT "Katafigio_pkey" PRIMARY KEY ("id_katafigiou")
);

-- CreateTable
CREATE TABLE "Eksoplismos" (
    "id_eksoplismou" SERIAL NOT NULL,
    "onoma" TEXT,
    "xroma" TEXT,
    "imerominia_kataskeuis" TIMESTAMP(3),
    "megethos" TEXT,
    "marka" TEXT,

    CONSTRAINT "Eksoplismos_pkey" PRIMARY KEY ("id_eksoplismou")
);

-- CreateTable
CREATE TABLE "Athlima" (
    "id_athlimatos" SERIAL NOT NULL,
    "onoma" TEXT,

    CONSTRAINT "Athlima_pkey" PRIMARY KEY ("id_athlimatos")
);

-- CreateTable
CREATE TABLE "EidosSindromis" (
    "id_eidous_sindromis" SERIAL NOT NULL,
    "titlos" TEXT,
    "timi" INTEGER,

    CONSTRAINT "EidosSindromis_pkey" PRIMARY KEY ("id_eidous_sindromis")
);

-- CreateTable
CREATE TABLE "Sxoli" (
    "id_sxolis" SERIAL NOT NULL,
    "timi" INTEGER,
    "epipedo" TEXT,
    "klados" TEXT,
    "etos" INTEGER,
    "seira" INTEGER,
    "hmerominia_enarksis" TIMESTAMP(3),
    "hmerominia_liksis" TIMESTAMP(3),
    "topothesia" TEXT,

    CONSTRAINT "Sxoli_pkey" PRIMARY KEY ("id_sxolis")
);

-- CreateTable
CREATE TABLE "Melos" (
    "id_melous" SERIAL NOT NULL,
    "id_vathmou_diskolias" INTEGER,

    CONSTRAINT "Melos_pkey" PRIMARY KEY ("id_melous")
);

-- CreateTable
CREATE TABLE "EsoterikoMelos" (
    "id_es_melous" SERIAL NOT NULL,
    "hmerominia_gennhshs" TIMESTAMP(3),
    "patronimo" TEXT,
    "odos" TEXT,
    "tk" INTEGER,
    "arithmos_mitroou" INTEGER NOT NULL,

    CONSTRAINT "EsoterikoMelos_pkey" PRIMARY KEY ("id_es_melous")
);

-- CreateTable
CREATE TABLE "EksoterikoMelos" (
    "id_ekso_melous" SERIAL NOT NULL,
    "onoma_sillogou" TEXT,
    "arithmos_mitroou" INTEGER NOT NULL,

    CONSTRAINT "EksoterikoMelos_pkey" PRIMARY KEY ("id_ekso_melous")
);

-- CreateTable
CREATE TABLE "Athlitis" (
    "id_athliti" SERIAL NOT NULL,
    "arithmos_deltiou" INTEGER,
    "hmerominia_enarksis_deltiou" TIMESTAMP(3),
    "hmerominia_liksis_deltiou" TIMESTAMP(3),

    CONSTRAINT "Athlitis_pkey" PRIMARY KEY ("id_athliti")
);

-- CreateTable
CREATE TABLE "Sindromitis" (
    "id_sindromiti" SERIAL NOT NULL,

    CONSTRAINT "Sindromitis_pkey" PRIMARY KEY ("id_sindromiti")
);

-- CreateTable
CREATE TABLE "Drastiriotita" (
    "id_drastiriotitas" SERIAL NOT NULL,
    "id_eksormisis" INTEGER,
    "id_vathmou_diskolias" INTEGER,
    "ores_poreias" INTEGER,
    "titlos" TEXT,
    "diafora_ipsous" INTEGER,
    "imerominia" TIMESTAMP(3),
    "megisto_ipsometro" INTEGER,

    CONSTRAINT "Drastiriotita_pkey" PRIMARY KEY ("id_drastiriotitas")
);

-- CreateTable
CREATE TABLE "Sindromi" (
    "id_sindromis" SERIAL NOT NULL,
    "hmerominia_enarksis" TIMESTAMP(3),
    "id_eidous_sindromis" INTEGER,

    CONSTRAINT "Sindromi_pkey" PRIMARY KEY ("id_sindromis")
);

-- CreateTable
CREATE TABLE "Ekpaideutis" (
    "id_ekpaideuti" SERIAL NOT NULL,
    "id_epafis" INTEGER,
    "epipedo" TEXT,
    "klados" TEXT,

    CONSTRAINT "Ekpaideutis_pkey" PRIMARY KEY ("id_ekpaideuti")
);

-- CreateTable
CREATE TABLE "Kratisi_Katafigiou" (
    "id_kratisis" SERIAL NOT NULL,
    "id_epafis" INTEGER,
    "id_katafigiou" INTEGER,
    "hmerominia_afiksis" TIMESTAMP(3),
    "hmerominia_epistrofis" TIMESTAMP(3),
    "ypoloipo" INTEGER,
    "arithmos_melwn" INTEGER,
    "arithmos_mi_melwn" INTEGER,
    "atoma" INTEGER,
    "imeres" INTEGER,
    "sinoliki_timh" INTEGER,
    "eksoterikos_xoros" TEXT,
    "hmerominia_akirosis" TIMESTAMP(3),
    "poso_epistrofis" INTEGER,
    "hmerominia_kratisis" TIMESTAMP(3),

    CONSTRAINT "Kratisi_Katafigiou_pkey" PRIMARY KEY ("id_kratisis")
);

-- CreateTable
CREATE TABLE "Daneizetai" (
    "id_epafis" INTEGER NOT NULL,
    "id_eksoplismou" INTEGER NOT NULL,
    "imerominia_daneismou" TIMESTAMP(3),
    "imerominia_epistrofis" TIMESTAMP(3),

    CONSTRAINT "Daneizetai_pkey" PRIMARY KEY ("id_epafis","id_eksoplismou")
);

-- CreateTable
CREATE TABLE "Eksoflei" (
    "id_epafis" INTEGER NOT NULL,
    "id_kratisis" INTEGER NOT NULL,
    "poso" INTEGER,
    "hmerominia_eksoflisis" TIMESTAMP(3),

    CONSTRAINT "Eksoflei_pkey" PRIMARY KEY ("id_epafis","id_kratisis")
);

-- CreateTable
CREATE TABLE "Ekpaideuei" (
    "id_ekpaideuti" INTEGER NOT NULL,
    "id_sxolis" INTEGER NOT NULL,

    CONSTRAINT "Ekpaideuei_pkey" PRIMARY KEY ("id_ekpaideuti","id_sxolis")
);

-- CreateTable
CREATE TABLE "Simmetoxi" (
    "id_simmetoxis" SERIAL NOT NULL,
    "id_melous" INTEGER,
    "id_drastiriotitas" INTEGER,
    "poso_epistrofis" INTEGER,
    "timi" INTEGER,
    "katastasi" TEXT,
    "ypoloipo" INTEGER,
    "hmerominia_dilosis" TIMESTAMP(3),
    "hmerominia_akirosis" TIMESTAMP(3),

    CONSTRAINT "Simmetoxi_pkey" PRIMARY KEY ("id_simmetoxis")
);

-- CreateTable
CREATE TABLE "Plironei" (
    "id_melous" INTEGER NOT NULL,
    "id_simmetoxis" INTEGER NOT NULL,
    "imerominia_pliromis" TIMESTAMP(3),
    "poso_pliromis" INTEGER,

    CONSTRAINT "Plironei_pkey" PRIMARY KEY ("id_melous","id_simmetoxis")
);

-- CreateTable
CREATE TABLE "Exei" (
    "id_sindromiti" INTEGER NOT NULL,
    "id_sindromis" INTEGER NOT NULL,
    "imerominia_pliromis" TIMESTAMP(3),

    CONSTRAINT "Exei_pkey" PRIMARY KEY ("id_sindromiti","id_sindromis")
);

-- CreateTable
CREATE TABLE "Asxoleitai" (
    "id_athliti" INTEGER NOT NULL,
    "id_athlimatos" INTEGER NOT NULL,

    CONSTRAINT "Asxoleitai_pkey" PRIMARY KEY ("id_athliti","id_athlimatos")
);

-- CreateTable
CREATE TABLE "Agones" (
    "id_agona" SERIAL NOT NULL,
    "id_athlimatos" INTEGER,
    "perigrafi" TEXT,
    "hmerominia" TIMESTAMP(3),
    "onoma" TEXT,

    CONSTRAINT "Agones_pkey" PRIMARY KEY ("id_agona")
);

-- CreateTable
CREATE TABLE "Agonizetai" (
    "id_athliti" INTEGER NOT NULL,
    "id_agona" INTEGER NOT NULL,

    CONSTRAINT "Agonizetai_pkey" PRIMARY KEY ("id_athliti","id_agona")
);

-- CreateTable
CREATE TABLE "Parakolouthisi" (
    "id_parakolouthisis" SERIAL NOT NULL,
    "id_melous" INTEGER,
    "id_sxolis" INTEGER,
    "poso_epistrofis" INTEGER,
    "timi" INTEGER,
    "ypoloipo" INTEGER,
    "katastasi" TEXT,
    "hmerominia_dilosis" TIMESTAMP(3),
    "hmerominia_akrirosis" TIMESTAMP(3),

    CONSTRAINT "Parakolouthisi_pkey" PRIMARY KEY ("id_parakolouthisis")
);

-- CreateTable
CREATE TABLE "Katavalei" (
    "id_melous" INTEGER NOT NULL,
    "id_parakolouthisis" INTEGER NOT NULL,
    "poso" INTEGER,
    "hmerominia_katavolhs" TIMESTAMP(3),

    CONSTRAINT "Katavalei_pkey" PRIMARY KEY ("id_melous","id_parakolouthisis")
);

-- CreateIndex
CREATE UNIQUE INDEX "EsoterikoMelos_arithmos_mitroou_key" ON "EsoterikoMelos"("arithmos_mitroou");

-- CreateIndex
CREATE UNIQUE INDEX "EksoterikoMelos_arithmos_mitroou_key" ON "EksoterikoMelos"("arithmos_mitroou");
