import { PrismaClient } from "../generated/prisma";

declare global {
  // Allow global prisma reuse in development
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

prisma
  .$connect()
  .then(() => console.log("Prisma connected to MongoDB"))
  .catch((err: unknown) => {
    console.error("Prisma connection error:", err);
  });

export { prisma };
export default prisma;
