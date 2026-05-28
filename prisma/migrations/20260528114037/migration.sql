/*
  Warnings:

  - A unique constraint covering the columns `[homeTeam,awayTeam,sport,startTime]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Match_homeTeam_awayTeam_sport_startTime_key" ON "Match"("homeTeam", "awayTeam", "sport", "startTime");
