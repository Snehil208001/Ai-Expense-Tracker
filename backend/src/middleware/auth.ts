import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * Require authenticated user - use after JWT verify
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  const user = request.user as { id: string; tenantId: string };
  request.userId = user.id;
  request.tenantId = user.tenantId;
}
