-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commentary" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "actor" TEXT,
    "message" TEXT NOT NULL,
    "minute" INTEGER,
    "sequence" INTEGER NOT NULL,
    "period" TEXT,
    "eventType" TEXT,
    "team" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commentary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Commentary_matchId_idx" ON "Commentary"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Commentary_matchId_sequence_key" ON "Commentary"("matchId", "sequence");

-- AddForeignKey
ALTER TABLE "Commentary" ADD CONSTRAINT "Commentary_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
