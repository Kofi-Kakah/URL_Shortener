import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./src/routes/auth.routes.js";
import { prisma } from "./src/lib/prisma.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth", authRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

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
