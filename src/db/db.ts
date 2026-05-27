import { env } from "bun";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
