/*
  Warnings:

  - You are about to drop the column `channelId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `pseudoId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `Channel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pseudo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_pseudoId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "channelId",
DROP COLUMN "pseudoId";

-- DropTable
DROP TABLE "Channel";

-- DropTable
DROP TABLE "Pseudo";
