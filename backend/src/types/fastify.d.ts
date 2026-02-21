import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: unknown, reply: unknown) => Promise<void>;
  }
  interface FastifyRequest {
    tenantId?: string;
    userId?: string;
  }
}
