/\*\*

- BACKEND SETUP GUIDE
-
- This is a reference implementation for the authentication backend.
- Use this as a guide for your Express.js backend.
  \*/

// ============================================
// 1. INSTALL DEPENDENCIES
// ============================================

/_
npm install express prisma @prisma/client
npm install bcryptjs jsonwebtoken
npm install dotenv cors helmet express-rate-limit
npm install nodemailer
npm install --save-dev typescript ts-node @types/node @types/express
_/

// ============================================
// 2. PRISMA SETUP
// ============================================

/\*
// prisma/schema.prisma

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

generator client {
provider = "prisma-client-js"
}

model User {
id String @id @default(cuid())
email String @unique
passwordHash String
name String
role String @default("user")
emailVerified Boolean @default(false)
lastLoginAt DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

refreshTokens RefreshToken[]
verificationTokens VerificationToken[]

@@index([email])
}

model RefreshToken {
id String @id @default(cuid())
userId String
tokenHash String @unique
expiresAt DateTime
revokedAt DateTime?
createdAt DateTime @default(now())

user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([userId])
@@index([tokenHash])
}

model VerificationToken {
id String @id @default(cuid())
userId String
tokenHash String @unique
type String // "email_verification" or "password_reset"
expiresAt DateTime
usedAt DateTime?
createdAt DateTime @default(now())

user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([userId])
@@index([tokenHash])
}
\*/

// ============================================
// 3. ENVIRONMENT VARIABLES
// ============================================

/\*
// .env

DATABASE_URL="postgresql://user:password@localhost:5432/anilist_archive"
JWT_SECRET="your-super-secret-key-min-32-chars-long-!@#$%^&*()"
REFRESH_TOKEN_SECRET="your-refresh-secret-key-min-32-chars-!@#$%^&\*()"

EMAIL_FROM="noreply@example.com"
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER="your-email@gmail.com"
EMAIL_SMTP_PASS="your-app-password"

CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
\*/

// ============================================
// 4. MIDDLEWARE IMPLEMENTATIONS
// ============================================

/\*
// src/middleware/auth.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
userId?: string;
user?: any;
}

export async function authMiddleware(
req: AuthRequest,
res: Response,
next: NextFunction
) {
try {
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith("Bearer ")) {
return res.status(401).json({
success: false,
error: { message: "No token provided", code: "UNAUTHORIZED" },
});
}

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    req.userId = (decoded as any).sub;
    next();

} catch (error) {
res.status(401).json({
success: false,
error: { message: "Invalid token", code: "UNAUTHORIZED" },
});
}
}

// src/middleware/rateLimiter.ts

import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
windowMs: 60 \* 1000, // 1 minute
max: 5, // 5 requests per windowMs
message: "Too many login attempts",
standardHeaders: false,
skip: (req) => process.env.NODE_ENV === "development",
});

// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from "express";

export function errorHandler(
err: any,
req: Request,
res: Response,
next: NextFunction
) {
console.error(err);

res.status(500).json({
success: false,
error: {
message: "Internal server error",
code: "INTERNAL_SERVER_ERROR",
},
});
}
\*/

// ============================================
// 5. UTILITY FUNCTIONS
// ============================================

/\*
// src/utils/crypto.ts

import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
return bcrypt.hash(password, 12);
}

export async function verifyPassword(
password: string,
hash: string
): Promise<boolean> {
return bcrypt.compare(password, hash);
}

export function generateToken(): string {
return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
return crypto.createHash("sha256").update(token).digest("hex");
}

// src/utils/jwt.ts

import jwt from "jsonwebtoken";

export interface TokenPayload {
sub: string; // user id
email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
return jwt.sign(payload, process.env.JWT_SECRET!, {
expiresIn: "15m", // 15 minute expiry
});
}

export function generateRefreshToken(payload: TokenPayload): string {
return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
expiresIn: "7d", // 7 day expiry
});
}

// src/utils/email.ts

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
host: process.env.EMAIL_SMTP_HOST,
port: parseInt(process.env.EMAIL_SMTP_PORT!),
secure: false,
auth: {
user: process.env.EMAIL_SMTP_USER,
pass: process.env.EMAIL_SMTP_PASS,
},
});

export async function sendVerificationEmail(email: string, token: string) {
const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

await transporter.sendMail({
from: process.env.EMAIL_FROM,
to: email,
subject: "Verify your email",
html: `Click <a href="${verifyUrl}">here</a> to verify your email.`,
});
}

export async function sendPasswordResetEmail(email: string, token: string) {
const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

await transporter.sendMail({
from: process.env.EMAIL_FROM,
to: email,
subject: "Reset your password",
html: `Click <a href="${resetUrl}">here</a> to reset your password.`,
});
}
\*/

// ============================================
// 6. ROUTE HANDLERS SKELETON
// ============================================

/\*
// src/routes/auth.ts

import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, generateToken, hashToken } from "../utils/crypto";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";
import { loginLimiter } from "../middleware/rateLimiter";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post("/register", async (req, res) => {
// 1. Validate inputs
// 2. Check email not registered
// 3. Hash password
// 4. Create user
// 5. Generate verification token
// 6. Send verification email
// 7. Return user
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
// 1. Validate inputs
// 2. Find user
// 3. Verify password
// 4. Check email verified
// 5. Generate tokens
// 6. Store refresh token
// 7. Set cookie
// 8. Return tokens
});

// POST /api/auth/logout
router.post("/logout", authMiddleware, async (req: AuthRequest, res: Response) => {
// 1. Delete refresh token
// 2. Clear cookie
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
// 1. Get refresh token from cookie
// 2. Verify in database
// 3. Generate new access token
// 4. Return new token
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
// 1. Find user (don't disclose if not found)
// 2. Generate reset token
// 3. Store token
// 4. Send email
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
// 1. Verify token
// 2. Hash new password
// 3. Update user
// 4. Delete token
});

// GET /api/auth/verify-email
router.get("/verify-email", async (req, res) => {
// 1. Verify token
// 2. Update user
// 3. Delete token
});

// GET /api/me
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
// 1. Get user
// 2. Return user
});

export default router;
\*/

// ============================================
// 7. MAIN SERVER FILE
// ============================================

/\*
// src/server.ts

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
origin: process.env.CLIENT_URL,
credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
\*/

export const BACKEND_SETUP_COMPLETE = true;
