-- AlterEnum
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "TicketStatus" RENAME VALUE 'OPEN' TO 'NEW';
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "Ticket" RENAME COLUMN "title" TO "subject";
