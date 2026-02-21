import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * Tenant middleware - injects tenantId from JWT or header
 * For SaaS: X-Tenant-Id header or tenant from JWT payload
 */
export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // If user is authenticated, tenantId comes from JWT
  const user = request.user as { tenantId?: string } | undefined;
  if (user?.tenantId) {
    request.tenantId = user.tenantId;
    return;
  }

  // Fallback: header (for admin or service-to-service)
  const tenantHeader = request.headers["x-tenant-id"];
  if (typeof tenantHeader === "string") {
    request.tenantId = tenantHeader;
  }
}
