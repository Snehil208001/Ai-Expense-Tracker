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

console.log("[boot] Starting...");

async function main() {
  console.log("[start] Loading env...");
  const env = loadEnv();
  console.log("[start] Env OK, PORT=" + env.PORT);

  const app = Fastify({ logger: true });

  // Root health (for Railway/proxy checks)
  app.get("/", async () => ({ ok: true, service: "expense-tracker-api" }));

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

  console.log("[start] Listening on 0.0.0.0:" + env.PORT);
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`🚀 Server running at http://0.0.0.0:${env.PORT}`);
  console.log(`   Health: http://localhost:${env.PORT}/api/health`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  if (err?.message) console.error("Message:", err.message);
  if (err?.stack) console.error("Stack:", err.stack);
  process.exit(1);
});
