import { randomUUID } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { database } from './database.js';
function mapUser(row) {
    return { id: row.id, email: row.email, role: row.role };
}
export function findUserByEmail(email) {
    const row = database.prepare(`
    SELECT id, email, password_hash, role FROM users WHERE email = ?
  `).get(email.trim().toLowerCase());
    return row ? { ...mapUser(row), passwordHash: row.password_hash } : undefined;
}
export function findUserById(id) {
    const row = database.prepare('SELECT id, email, password_hash, role FROM users WHERE id = ?')
        .get(id);
    return row ? mapUser(row) : undefined;
}
export async function registerUser(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await hash(password, 12);
    const user = {
        id: randomUUID(),
        email: normalizedEmail,
        role: 'user',
    };
    try {
        database.prepare(`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'user', ?)
    `).run(user.id, user.email, passwordHash, new Date().toISOString());
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            throw new Error('Email already registered');
        }
        throw error;
    }
    return user;
}
export async function verifyPassword(user, password) {
    return compare(password, user.passwordHash);
}
export async function seedAdminFromEnv() {
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
