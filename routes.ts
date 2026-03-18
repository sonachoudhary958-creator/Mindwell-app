import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { encrypt, decrypt } from "./encryption";
import { insertUserSchema, loginUserSchema, insertJournalEntrySchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "mindwell-jwt-secret";

interface AuthRequest extends Request {
  userId?: string;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }
      const { name, email, password } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        id: randomUUID(),
        name,
        email,
        password: hashedPassword,
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }
      const { email, password } = parsed.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Auth: Me
  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Journal: List entries
  app.get("/api/journal", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const entries = await storage.getJournalEntries(req.userId!);
      const decrypted = entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        mood: e.mood,
        energy: e.energy,
        createdAt: e.createdAt,
        content: (() => {
          try { return decrypt(e.encryptedContent); } catch { return ""; }
        })(),
      }));
      res.json(decrypted);
    } catch (err) {
      console.error("Journal list error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Journal: Create entry
  app.post("/api/journal", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const parsed = insertJournalEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }
      const { content, mood, energy } = parsed.data;
      const encryptedContent = encrypt(content);
      const entry = await storage.createJournalEntry({
        id: randomUUID(),
        userId: req.userId!,
        encryptedContent,
        mood,
        energy,
      });
      res.status(201).json({
        id: entry.id,
        userId: entry.userId,
        mood: entry.mood,
        energy: entry.energy,
        createdAt: entry.createdAt,
        content,
      });
    } catch (err) {
      console.error("Journal create error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Journal: Get single entry
  app.get("/api/journal/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const entry = await storage.getJournalEntry(req.params.id, req.userId!);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      res.json({
        id: entry.id,
        userId: entry.userId,
        mood: entry.mood,
        energy: entry.energy,
        createdAt: entry.createdAt,
        content: (() => {
          try { return decrypt(entry.encryptedContent); } catch { return ""; }
        })(),
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Journal: Delete entry
  app.delete("/api/journal/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.deleteJournalEntry(req.params.id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Entry not found" });
      res.json({ message: "Entry deleted" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
