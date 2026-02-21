-- CreateTable
CREATE TABLE "AiLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gemini',
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiLog_tenantId_idx" ON "AiLog"("tenantId");

-- CreateIndex
CREATE INDEX "AiLog_userId_idx" ON "AiLog"("userId");
