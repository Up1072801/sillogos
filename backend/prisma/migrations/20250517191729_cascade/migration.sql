-- DropForeignKey
ALTER TABLE "Agones" DROP CONSTRAINT "Agones_id_athlimatos_fkey";

-- DropForeignKey
ALTER TABLE "Agonizetai" DROP CONSTRAINT "Agonizetai_id_agona_fkey";

-- DropForeignKey
ALTER TABLE "Agonizetai" DROP CONSTRAINT "Agonizetai_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Asxoleitai" DROP CONSTRAINT "Asxoleitai_id_athlimatos_fkey";

-- DropForeignKey
ALTER TABLE "Asxoleitai" DROP CONSTRAINT "Asxoleitai_id_athliti_fkey";

-- DropForeignKey
ALTER TABLE "Daneizetai" DROP CONSTRAINT "Daneizetai_id_eksoplismou_fkey";

-- DropForeignKey
ALTER TABLE "Daneizetai" DROP CONSTRAINT "Daneizetai_id_epafis_fkey";

-- DropForeignKey
ALTER TABLE "Drastiriotita" DROP CONSTRAINT "Drastiriotita_id_eksormisis_fkey";

-- DropForeignKey
ALTER TABLE "Drastiriotita" DROP CONSTRAINT "Drastiriotita_id_vathmou_diskolias_fkey";

-- DropForeignKey
ALTER TABLE "Ekpaideuei" DROP CONSTRAINT "Ekpaideuei_id_ekpaideuti_fkey";

-- DropForeignKey
ALTER TABLE "Ekpaideuei" DROP CONSTRAINT "Ekpaideuei_id_sxolis_fkey";

-- DropForeignKey
ALTER TABLE "Eksoflei" DROP CONSTRAINT "Eksoflei_id_epafis_fkey";

-- DropForeignKey
ALTER TABLE "Eksoflei" DROP CONSTRAINT "Eksoflei_id_kratisis_fkey";

-- DropForeignKey
ALTER TABLE "Exei" DROP CONSTRAINT "Exei_id_sindromis_fkey";

-- DropForeignKey
ALTER TABLE "Exei" DROP CONSTRAINT "Exei_id_sindromiti_fkey";

-- DropForeignKey
ALTER TABLE "Katavalei" DROP CONSTRAINT "Katavalei_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Katavalei" DROP CONSTRAINT "Katavalei_id_parakolouthisis_fkey";

-- DropForeignKey
ALTER TABLE "Kratisi_Katafigiou" DROP CONSTRAINT "Kratisi_Katafigiou_id_epafis_fkey";

-- DropForeignKey
ALTER TABLE "Kratisi_Katafigiou" DROP CONSTRAINT "Kratisi_Katafigiou_id_katafigiou_fkey";

-- DropForeignKey
ALTER TABLE "Melos" DROP CONSTRAINT "Melos_id_vathmou_diskolias_fkey";

-- DropForeignKey
ALTER TABLE "Parakolouthisi" DROP CONSTRAINT "Parakolouthisi_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Parakolouthisi" DROP CONSTRAINT "Parakolouthisi_id_sxolis_fkey";

-- DropForeignKey
ALTER TABLE "Plironei" DROP CONSTRAINT "Plironei_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Plironei" DROP CONSTRAINT "Plironei_id_simmetoxis_fkey";

-- DropForeignKey
ALTER TABLE "Simmetoxi" DROP CONSTRAINT "Simmetoxi_id_drastiriotitas_fkey";

-- DropForeignKey
ALTER TABLE "Simmetoxi" DROP CONSTRAINT "Simmetoxi_id_melous_fkey";

-- DropForeignKey
ALTER TABLE "Sindromi" DROP CONSTRAINT "Sindromi_id_eidous_sindromis_fkey";

-- AddForeignKey
ALTER TABLE "Melos" ADD CONSTRAINT "Melos_id_vathmou_diskolias_fkey" FOREIGN KEY ("id_vathmou_diskolias") REFERENCES "VathmosDiskolias"("id_vathmou_diskolias") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drastiriotita" ADD CONSTRAINT "Drastiriotita_id_eksormisis_fkey" FOREIGN KEY ("id_eksormisis") REFERENCES "Eksormisi"("id_eksormisis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drastiriotita" ADD CONSTRAINT "Drastiriotita_id_vathmou_diskolias_fkey" FOREIGN KEY ("id_vathmou_diskolias") REFERENCES "VathmosDiskolias"("id_vathmou_diskolias") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sindromi" ADD CONSTRAINT "Sindromi_id_eidous_sindromis_fkey" FOREIGN KEY ("id_eidous_sindromis") REFERENCES "EidosSindromis"("id_eidous_sindromis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kratisi_Katafigiou" ADD CONSTRAINT "Kratisi_Katafigiou_id_epafis_fkey" FOREIGN KEY ("id_epafis") REFERENCES "Epafes"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kratisi_Katafigiou" ADD CONSTRAINT "Kratisi_Katafigiou_id_katafigiou_fkey" FOREIGN KEY ("id_katafigiou") REFERENCES "Katafigio"("id_katafigiou") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Daneizetai" ADD CONSTRAINT "Daneizetai_id_epafis_fkey" FOREIGN KEY ("id_epafis") REFERENCES "Epafes"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Daneizetai" ADD CONSTRAINT "Daneizetai_id_eksoplismou_fkey" FOREIGN KEY ("id_eksoplismou") REFERENCES "Eksoplismos"("id_eksoplismou") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eksoflei" ADD CONSTRAINT "Eksoflei_id_epafis_fkey" FOREIGN KEY ("id_epafis") REFERENCES "Epafes"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eksoflei" ADD CONSTRAINT "Eksoflei_id_kratisis_fkey" FOREIGN KEY ("id_kratisis") REFERENCES "Kratisi_Katafigiou"("id_kratisis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ekpaideuei" ADD CONSTRAINT "Ekpaideuei_id_ekpaideuti_fkey" FOREIGN KEY ("id_ekpaideuti") REFERENCES "Ekpaideutis"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ekpaideuei" ADD CONSTRAINT "Ekpaideuei_id_sxolis_fkey" FOREIGN KEY ("id_sxolis") REFERENCES "Sxoli"("id_sxolis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simmetoxi" ADD CONSTRAINT "Simmetoxi_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simmetoxi" ADD CONSTRAINT "Simmetoxi_id_drastiriotitas_fkey" FOREIGN KEY ("id_drastiriotitas") REFERENCES "Drastiriotita"("id_drastiriotitas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plironei" ADD CONSTRAINT "Plironei_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plironei" ADD CONSTRAINT "Plironei_id_simmetoxis_fkey" FOREIGN KEY ("id_simmetoxis") REFERENCES "Simmetoxi"("id_simmetoxis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exei" ADD CONSTRAINT "Exei_id_sindromis_fkey" FOREIGN KEY ("id_sindromis") REFERENCES "Sindromi"("id_sindromis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exei" ADD CONSTRAINT "Exei_id_sindromiti_fkey" FOREIGN KEY ("id_sindromiti") REFERENCES "Sindromitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asxoleitai" ADD CONSTRAINT "Asxoleitai_id_athlimatos_fkey" FOREIGN KEY ("id_athlimatos") REFERENCES "Athlima"("id_athlimatos") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asxoleitai" ADD CONSTRAINT "Asxoleitai_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agones" ADD CONSTRAINT "Agones_id_athlimatos_fkey" FOREIGN KEY ("id_athlimatos") REFERENCES "Athlima"("id_athlimatos") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agonizetai" ADD CONSTRAINT "Agonizetai_id_agona_fkey" FOREIGN KEY ("id_agona") REFERENCES "Agones"("id_agona") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agonizetai" ADD CONSTRAINT "Agonizetai_id_athliti_fkey" FOREIGN KEY ("id_athliti") REFERENCES "Athlitis"("id_es_melous") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parakolouthisi" ADD CONSTRAINT "Parakolouthisi_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parakolouthisi" ADD CONSTRAINT "Parakolouthisi_id_sxolis_fkey" FOREIGN KEY ("id_sxolis") REFERENCES "Sxoli"("id_sxolis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Katavalei" ADD CONSTRAINT "Katavalei_id_melous_fkey" FOREIGN KEY ("id_melous") REFERENCES "Melos"("id_epafis") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Katavalei" ADD CONSTRAINT "Katavalei_id_parakolouthisis_fkey" FOREIGN KEY ("id_parakolouthisis") REFERENCES "Parakolouthisi"("id_parakolouthisis") ON DELETE CASCADE ON UPDATE CASCADE;
