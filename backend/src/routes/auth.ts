import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signupSchema, loginSchema } from "./auth.schema.js";

type SignupBody = { email: string; password: string; name?: string; tenantName?: string };
type LoginBody = { email: string; password: string; tenantId?: string };

export async function authRoutes(app: FastifyInstance) {
  // Health check (no auth)
  app.get("/health", async () => ({ ok: true, timestamp: new Date().toISOString() }));

  // Signup - creates tenant + user for new org
  app.post<{ Body: SignupBody }>(
    "/auth/signup",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            name: { type: "string" },
            tenantName: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SignupBody }>, reply: FastifyReply) => {
      const parsed = signupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const { email, password, name, tenantName } = parsed.data;

      // Create slug from tenant name or email domain
      const slug =
        tenantName?.toLowerCase().replace(/\s+/g, "-") ??
        email.split("@")[0].toLowerCase();

      // Check if tenant slug exists
      const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
      if (existingTenant) {
        return reply.status(409).send({
          success: false,
          error: "Tenant already exists with this name. Try a different tenant name.",
        });
      }

      // Check if user exists in any tenant
      const existingUser = await prisma.user.findFirst({
        where: { email },
      });
      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: "Email already registered",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const tenant = await prisma.tenant.create({
        data: {
          name: tenantName ?? slug,
          slug,
        },
      });

      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          name: name ?? email.split("@")[0],
        },
      });

      const token = app.jwt.sign(
        {
          id: user.id,
          tenantId: tenant.id,
          email: user.email,
        },
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" }
      );

      return reply.status(201).send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
          },
          token,
          expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
        },
      });
    }
  );

  // Login
  app.post<{ Body: LoginBody }>(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
            tenantId: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const { email, password, tenantId } = parsed.data;

      const user = await prisma.user.findFirst({
        where: {
          email,
          ...(tenantId ? { tenantId } : {}),
        },
        include: { tenant: true },
      });

      if (!user || !user.passwordHash) {
        return reply.status(401).send({
          success: false,
          error: "Invalid email or password",
        });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({
          success: false,
          error: "Invalid email or password",
        });
      }

      if (!user.tenant.isActive) {
        return reply.status(403).send({
          success: false,
          error: "Tenant account is inactive",
        });
      }

      const token = app.jwt.sign(
        {
          id: user.id,
          tenantId: user.tenantId,
          email: user.email,
        },
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" }
      );

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId,
            tenantSlug: user.tenant.slug,
          },
          token,
          expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
        },
      });
    }
  );

  // Get current user (protected)
  app.get(
    "/auth/me",
    { onRequest: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string; email: string };

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

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({
        success: true,
        data: { user },
      });
    }
  );
}
