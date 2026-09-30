-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(32) NOT NULL,
    "destination" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickEvent" (
    "id" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,
    "clickedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "countryCode" CHAR(2),
    "deviceType" VARCHAR(32),
    "browser" VARCHAR(128),
    "operatingSystem" VARCHAR(128),
    "referrer" TEXT,

    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_slug_key" ON "ShortLink"("slug");

-- CreateIndex
CREATE INDEX "ShortLink_createdAt_idx" ON "ShortLink"("createdAt");

-- CreateIndex
CREATE INDEX "ShortLink_isActive_expiresAt_idx" ON "ShortLink"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "ClickEvent_shortLinkId_clickedAt_idx" ON "ClickEvent"("shortLinkId", "clickedAt");

-- CreateIndex
CREATE INDEX "ClickEvent_shortLinkId_countryCode_clickedAt_idx" ON "ClickEvent"("shortLinkId", "countryCode", "clickedAt");

-- CreateIndex
CREATE INDEX "ClickEvent_shortLinkId_deviceType_clickedAt_idx" ON "ClickEvent"("shortLinkId", "deviceType", "clickedAt");

-- CreateIndex
CREATE INDEX "ClickEvent_shortLinkId_browser_clickedAt_idx" ON "ClickEvent"("shortLinkId", "browser", "clickedAt");

-- CreateIndex
CREATE INDEX "ClickEvent_shortLinkId_operatingSystem_clickedAt_idx" ON "ClickEvent"("shortLinkId", "operatingSystem", "clickedAt");

-- AddForeignKey
ALTER TABLE "ClickEvent" ADD CONSTRAINT "ClickEvent_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
