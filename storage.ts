import { pool } from "./db";
import { randomUUID } from "crypto";
import type { User, InsertUser, JournalEntry } from "@shared/schema";

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id: string }): Promise<User>;
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  getJournalEntry(id: string, userId: string): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: {
    id: string;
    userId: string;
    encryptedContent: string;
    mood: number;
    energy: number;
  }): Promise<JournalEntry>;
  deleteJournalEntry(id: string, userId: string): Promise<boolean>;
}

export class PgStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const result = await pool.query(
      "SELECT id, name, email, password, created_at as \"createdAt\" FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await pool.query(
      "SELECT id, name, email, password, created_at as \"createdAt\" FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0];
  }

  async createUser(user: InsertUser & { id: string }): Promise<User> {
    const result = await pool.query(
      "INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email, password, created_at as \"createdAt\"",
      [user.id, user.name, user.email, user.password]
    );
    return result.rows[0];
  }

  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    const result = await pool.query(
      "SELECT id, user_id as \"userId\", encrypted_content as \"encryptedContent\", mood, energy, created_at as \"createdAt\" FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  }

  async getJournalEntry(id: string, userId: string): Promise<JournalEntry | undefined> {
    const result = await pool.query(
      "SELECT id, user_id as \"userId\", encrypted_content as \"encryptedContent\", mood, energy, created_at as \"createdAt\" FROM journal_entries WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return result.rows[0];
  }

  async createJournalEntry(entry: {
    id: string;
    userId: string;
    encryptedContent: string;
    mood: number;
    energy: number;
  }): Promise<JournalEntry> {
    const result = await pool.query(
      "INSERT INTO journal_entries (id, user_id, encrypted_content, mood, energy) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id as \"userId\", encrypted_content as \"encryptedContent\", mood, energy, created_at as \"createdAt\"",
      [entry.id, entry.userId, entry.encryptedContent, entry.mood, entry.energy]
    );
    return result.rows[0];
  }

  async deleteJournalEntry(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM journal_entries WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new PgStorage();
