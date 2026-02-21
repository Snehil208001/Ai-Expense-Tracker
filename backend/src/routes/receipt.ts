import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import multipart from "@fastify/multipart";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { pipeline } from "stream/promises";
import { prisma } from "../lib/prisma.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "receipts");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function receiptRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  await app.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE },
  });

  // Upload receipt
  app.post("/receipts/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as { id: string; tenantId: string };

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: "No file uploaded",
        message: "Send a multipart form with 'file' field",
      });
    }

    const mime = data.mimetype;
    if (!ALLOWED_TYPES.includes(mime)) {
      return reply.status(400).send({
        success: false,
        error: "Invalid file type",
        message: `Allowed: JPEG, PNG, WebP, PDF`,
      });
    }

    const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1];
    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(UPLOAD_DIR, payload.tenantId);
    const filepath = path.join(dir, filename);

    await mkdir(dir, { recursive: true });

    const writeStream = createWriteStream(filepath);
    await pipeline(data.file, writeStream);

    // Relative URL for storage (client will use full URL from config)
    const url = `/uploads/receipts/${payload.tenantId}/${filename}`;

    const receipt = await prisma.receipt.create({
      data: {
        tenantId: payload.tenantId,
        userId: payload.id,
        url,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        receipt: {
          id: receipt.id,
          url,
          createdAt: receipt.createdAt,
        },
      },
    });
  });

  // List user's receipts
  app.get("/receipts", async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as { id: string; tenantId: string };

    const receipts = await prisma.receipt.findMany({
      where: { tenantId: payload.tenantId, userId: payload.id },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ success: true, data: { receipts } });
  });

  // Get by id
  app.get(
    "/receipts/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { id } = request.params;

      const receipt = await prisma.receipt.findFirst({
        where: { id, tenantId: payload.tenantId, userId: payload.id },
      });
      if (!receipt) {
        return reply.status(404).send({ success: false, error: "Receipt not found" });
      }
      return reply.send({ success: true, data: { receipt } });
    }
  );
}
