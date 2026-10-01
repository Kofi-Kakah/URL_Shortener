import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./src/routes/auth.routes.js";
import urlRouter from "./src/routes/url.routes.js";
import redirectRouter from "./src/routes/redirect.routes.js";
import analyticsRouter from "./src/routes/analytics.routes.js";
import dashboardRouter from "./src/routes/dashboard.routes.js";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
import { prisma } from "./src/lib/prisma.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/urls", urlRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/", redirectRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorMiddleware);

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
