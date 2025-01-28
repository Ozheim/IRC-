/*
  Warnings:

  - You are about to drop the column `timestamp` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `_ChannelToMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MessageToPseudo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ChannelToMessage" DROP CONSTRAINT "_ChannelToMessage_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChannelToMessage" DROP CONSTRAINT "_ChannelToMessage_B_fkey";

-- DropForeignKey
ALTER TABLE "_MessageToPseudo" DROP CONSTRAINT "_MessageToPseudo_A_fkey";

-- DropForeignKey
ALTER TABLE "_MessageToPseudo" DROP CONSTRAINT "_MessageToPseudo_B_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "timestamp",
ADD COLUMN     "channelId" INTEGER,
ADD COLUMN     "pseudoId" INTEGER;

-- DropTable
DROP TABLE "_ChannelToMessage";

-- DropTable
DROP TABLE "_MessageToPseudo";

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_pseudoId_fkey" FOREIGN KEY ("pseudoId") REFERENCES "Pseudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
