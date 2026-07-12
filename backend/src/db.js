import { PrismaClient } from "@prisma/client";

// single shared client — import { prisma } everywhere, never new PrismaClient()
export const prisma = new PrismaClient();
