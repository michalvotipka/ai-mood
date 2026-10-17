-- CreateEnum
CREATE TYPE "AnalysisSource" AS ENUM ('text', 'screenshots');

-- CreateEnum
CREATE TYPE "MoodKind" AS ENUM ('conversation', 'message');

-- CreateTable
CREATE TABLE "mood_analyses" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "AnalysisSource" NOT NULL,
    "input_text" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "kind" "MoodKind" NOT NULL,
    "input_quality" REAL NOT NULL,
    "tone" SMALLINT NOT NULL,
    "dynamics" SMALLINT,
    "summary_en" TEXT NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "mood_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mood_analyses_created_at_idx" ON "mood_analyses"("created_at" DESC);
