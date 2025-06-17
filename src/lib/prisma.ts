import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaInstance = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prismaInstance;
}

prismaInstance
  .$connect()
  .then(() => console.log("Prisma connected to MongoDB"))
  .catch((err: unknown) => {
    console.error("Prisma connection error:", err);
  });

export const prisma = prismaInstance;
export default prismaInstance;
