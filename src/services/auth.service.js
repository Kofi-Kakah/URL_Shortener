import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const passwordRounds = 12;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required.");
  return secret;
}

function createToken(userId) {
  return jwt.sign({}, getJwtSecret(), { subject: userId, expiresIn: "7d" });
}

function toPublicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export async function createUser({ email, password }) {
  getJwtSecret();
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, passwordRounds);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash },
  });

  return { user: toPublicUser(user), token: createToken(user.id) };
}

export async function authenticateUser({ email, password }) {
  getJwtSecret();
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;

  return { user: toPublicUser(user), token: createToken(user.id) };
}

export async function findUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });
}

export function verifyAuthToken(token) {
  const payload = jwt.verify(token, getJwtSecret());
  if (typeof payload !== "object" || typeof payload.sub !== "string") return null;
  return { userId: payload.sub };
}
