-- CreateEnum
CREATE TYPE "AdminUserStatus" AS ENUM ('active', 'disabled', 'invited');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'rate_limit';

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN "status" "AdminUserStatus" NOT NULL DEFAULT 'active';
