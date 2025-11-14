-- AlterTable
ALTER TABLE "RegstrationRequest" ADD COLUMN     "isEmailVerified" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profile" TEXT;
