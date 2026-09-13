import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migraciones y CLI usan la conexión directa (sin pooler), nunca la de runtime.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
