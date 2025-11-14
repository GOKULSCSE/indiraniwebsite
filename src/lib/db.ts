import { PrismaClient } from '@prisma/client';

const db = global.prisma || new PrismaClient();

export default db;
