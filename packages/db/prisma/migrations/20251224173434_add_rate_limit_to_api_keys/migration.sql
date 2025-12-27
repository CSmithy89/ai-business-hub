-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN "rate_limit" INTEGER NOT NULL DEFAULT 1000;
