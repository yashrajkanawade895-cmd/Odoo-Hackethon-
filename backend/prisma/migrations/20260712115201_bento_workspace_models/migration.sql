-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('available', 'focus_time', 'in_meeting', 'wfh', 'away');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "MeetingPurpose" AS ENUM ('client', 'internal', 'interview', 'training', 'town_hall');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "attendees" INTEGER,
ADD COLUMN     "booked_for" TEXT,
ADD COLUMN     "purpose" "MeetingPurpose" NOT NULL DEFAULT 'internal';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "focus_status" "FocusStatus" NOT NULL DEFAULT 'available',
ADD COLUMN     "manager_id" INTEGER,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "project_id" INTEGER;

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "department_id" INTEGER,
    "meeting_location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
