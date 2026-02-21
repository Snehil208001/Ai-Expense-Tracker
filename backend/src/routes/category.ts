import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { createCategorySchema, updateCategorySchema } from "./category.schema.js";

type CreateBody = { name: string; icon?: string; color?: string; type?: "expense" | "income" };
type UpdateBody = Partial<CreateBody>;
type Params = { id: string };

export async function categoryRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  // List categories (tenant-scoped)
  app.get("/categories", async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as { tenantId: string };
    const type = (request.query as { type?: string }).type;

    const categories = await prisma.category.findMany({
      where: {
        tenantId: payload.tenantId,
        ...(type && ["expense", "income"].includes(type) ? { type } : {}),
      },
      orderBy: { name: "asc" },
    });

    return reply.send({ success: true, data: { categories } });
  });

  // Create category
  app.post<{ Body: CreateBody }>(
    "/categories",
    async (request: FastifyRequest<{ Body: CreateBody }>, reply: FastifyReply) => {
      const payload = request.user as { tenantId: string };
      const parsed = createCategorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const existing = await prisma.category.findUnique({
        where: {
          tenantId_name: { tenantId: payload.tenantId, name: parsed.data.name },
        },
      });
      if (existing) {
        return reply.status(409).send({
          success: false,
          error: "Category with this name already exists",
        });
      }

      const category = await prisma.category.create({
        data: {
          tenantId: payload.tenantId,
          name: parsed.data.name,
          icon: parsed.data.icon,
          color: parsed.data.color,
          type: parsed.data.type ?? "expense",
        },
      });

      return reply.status(201).send({ success: true, data: { category } });
    }
  );

  // Get by id
  app.get<{ Params: Params }>(
    "/categories/:id",
    async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
      const payload = request.user as { tenantId: string };
      const { id } = request.params;

      const category = await prisma.category.findFirst({
        where: { id, tenantId: payload.tenantId },
      });
      if (!category) {
        return reply.status(404).send({ success: false, error: "Category not found" });
      }
      return reply.send({ success: true, data: { category } });
    }
  );

  // Update
  app.patch<{ Params: Params; Body: UpdateBody }>(
    "/categories/:id",
    async (request: FastifyRequest<{ Params: Params; Body: UpdateBody }>, reply: FastifyReply) => {
      const payload = request.user as { tenantId: string };
      const { id } = request.params;
      const parsed = updateCategorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const existing = await prisma.category.findFirst({
        where: { id, tenantId: payload.tenantId },
      });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Category not found" });
      }

      if (parsed.data.name && parsed.data.name !== existing.name) {
        const duplicate = await prisma.category.findUnique({
          where: {
            tenantId_name: { tenantId: payload.tenantId, name: parsed.data.name },
          },
        });
        if (duplicate) {
          return reply.status(409).send({
            success: false,
            error: "Category with this name already exists",
          });
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: parsed.data,
      });

      return reply.send({ success: true, data: { category } });
    }
  );

  // Delete
  app.delete<{ Params: Params }>(
    "/categories/:id",
    async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
      const payload = request.user as { tenantId: string };
      const { id } = request.params;

      const existing = await prisma.category.findFirst({
        where: { id, tenantId: payload.tenantId },
      });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Category not found" });
      }

      await prisma.category.delete({ where: { id } });
      return reply.status(204).send();
    }
  );
}
