import { randomUUID } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { database } from './database.js';

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface UserRow extends Record<string, string> {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
}

function mapUser(row: UserRow): AuthUser {
  return { id: row.id, email: row.email, role: row.role };
}

export function findUserByEmail(email: string): (AuthUser & { passwordHash: string }) | undefined {
  const row = database.prepare(`
    SELECT id, email, password_hash, role FROM users WHERE email = ?
  `).get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? { ...mapUser(row), passwordHash: row.password_hash } : undefined;
}

export function findUserById(id: string): AuthUser | undefined {
  const row = database.prepare('SELECT id, email, password_hash, role FROM users WHERE id = ?')
    .get(id) as UserRow | undefined;
  return row ? mapUser(row) : undefined;
}

export async function registerUser(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hash(password, 12);
  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    role: 'user' as const,
  };
  try {
    database.prepare(`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'user', ?)
    `).run(user.id, user.email, passwordHash, new Date().toISOString());
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Email already registered');
    }
    throw error;
  }
  return user;
}

export async function verifyPassword(user: AuthUser & { passwordHash: string }, password: string) {
  return compare(password, user.passwordHash);
}

export async function seedAdminFromEnv(): Promise<void> {
  const email = process.env['ADMIN_EMAIL']?.trim().toLowerCase();
  const password = process.env['ADMIN_PASSWORD'];
  if (!email && !password && process.env['NODE_ENV'] !== 'production') {
    console.warn('Admin account is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.');
    return;
  }
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
  }

  const passwordHash = await hash(password, 12);
  database.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at)
    VALUES (?, ?, ?, 'admin', ?)
    ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin'
  `).run(randomUUID(), email, passwordHash, new Date().toISOString());
}