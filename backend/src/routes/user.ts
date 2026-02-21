import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { updateProfileSchema } from "./user.schema.js";

type UpdateBody = { name?: string; avatar?: string | null; currency?: string; monthlyBudget?: number | null };

export async function userRoutes(app: FastifyInstance) {
  // All user routes require auth
  app.addHook("onRequest", app.authenticate);

  // Get profile (alias for /auth/me, user-scoped)
  app.get("/users/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        currency: true,
        monthlyBudget: true,
        tenantId: true,
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!user) return reply.status(404).send({ success: false, error: "User not found" });
    return reply.send({ success: true, data: { user } });
  });

  // Update profile
  app.patch<{ Body: UpdateBody }>(
    "/users/me",
    async (request: FastifyRequest<{ Body: UpdateBody }>, reply: FastifyReply) => {
      const payload = request.user as { id: string };
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const data: Record<string, unknown> = {};
      if (parsed.data.name !== undefined) data.name = parsed.data.name;
      if (parsed.data.avatar !== undefined) data.avatar = parsed.data.avatar;
      if (parsed.data.currency !== undefined) data.currency = parsed.data.currency;
      if (parsed.data.monthlyBudget !== undefined) data.monthlyBudget = parsed.data.monthlyBudget;

      const user = await prisma.user.update({
        where: { id: payload.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          currency: true,
          monthlyBudget: true,
          tenantId: true,
          tenant: { select: { id: true, name: true, slug: true } },
        },
      });

      return reply.send({ success: true, data: { user } });
    }
  );
}
