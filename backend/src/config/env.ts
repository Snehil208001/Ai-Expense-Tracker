import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .string()
    .transform((v) => (["development", "production", "test"].includes(v) ? v : "production"))
    .default("production"),
  GOOGLE_GEMINI_API_KEY: z.string().optional(), // For AI features (Phase 3)
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.flatten(), null, 2));
    console.error("❌ Required: DATABASE_URL (valid URL), JWT_SECRET (16+ chars)");
    process.exit(1);
  }
  return parsed.data;
}
