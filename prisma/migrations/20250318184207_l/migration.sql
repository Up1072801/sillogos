-- CreateTable
CREATE TABLE "Ekpaideutis" (
    "id_ekpaideuti" SERIAL NOT NULL,
    "id_epafis" INTEGER NOT NULL,
    "epipedo" TEXT,
    "klados" TEXT,

    CONSTRAINT "Ekpaideutis_pkey" PRIMARY KEY ("id_ekpaideuti")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ekpaideutis_id_epafis_key" ON "Ekpaideutis"("id_epafis");

-- AddForeignKey
ALTER TABLE "Ekpaideutis" ADD CONSTRAINT "Ekpaideutis_id_epafis_fkey" FOREIGN KEY ("id_epafis") REFERENCES "Epafes"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;
