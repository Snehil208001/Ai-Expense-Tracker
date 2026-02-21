import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import fastifyStatic from "@fastify/static";
import path from "path";
import { mkdir } from "fs/promises";
import { loadEnv } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/user.js";
import { categoryRoutes } from "./routes/category.js";
import { expenseRoutes } from "./routes/expense.js";
import { receiptRoutes } from "./routes/receipt.js";
import { aiRoutes } from "./routes/ai.js";

async function main() {
  const env = loadEnv();

  const app = Fastify({ logger: true });

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  // Static files for uploads
  const uploadsPath = path.join(process.cwd(), "uploads");
  await mkdir(uploadsPath, { recursive: true });
  await app.register(fastifyStatic, {
    root: uploadsPath,
    prefix: "/uploads/",
  });

  // Auth decorator - verify JWT
  app.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        success: false,
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  });

  // Routes
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(userRoutes, { prefix: "/api" });
  await app.register(categoryRoutes, { prefix: "/api" });
  await app.register(expenseRoutes, { prefix: "/api" });
  await app.register(receiptRoutes, { prefix: "/api" });
  await app.register(aiRoutes, { prefix: "/api" });

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info("Shutting down...");
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`🚀 Server running at http://localhost:${env.PORT}`);
  console.log(`   Health: http://localhost:${env.PORT}/api/health`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
