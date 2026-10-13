import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCookie, stringifySetCookie } from 'cookie';
import { SignJWT, jwtVerify } from 'jose';
import { findUserById } from './auth.store.js';
function loadJwtSecret() {
    const configuredSecret = process.env['JWT_SECRET']?.trim();
    if (configuredSecret) {
        if (Buffer.byteLength(configuredSecret) < 32) {
            throw new Error('JWT_SECRET must be at least 32 bytes.');
        }
        return configuredSecret;
    }
    if (process.env['NODE_ENV'] === 'production') {
        throw new Error('JWT_SECRET must be configured in production with at least 32 bytes.');
    }
    const secretPath = process.env['JWT_SECRET_FILE']
        ? resolve(process.env['JWT_SECRET_FILE'])
        : fileURLToPath(new URL('../data/jwt-secret', import.meta.url));
    mkdirSync(dirname(secretPath), { recursive: true });
    try {
        const savedSecret = readFileSync(secretPath, 'utf8').trim();
        if (Buffer.byteLength(savedSecret) >= 32)
            return savedSecret;
        throw new Error('Saved development JWT secret is invalid. Remove it and restart the backend.');
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
    const generatedSecret = randomBytes(48).toString('base64url');
    try {
        writeFileSync(secretPath, generatedSecret, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
        return generatedSecret;
    }
    catch (error) {
        if (error.code !== 'EEXIST')
            throw error;
        return readFileSync(secretPath, 'utf8').trim();
    }
}
const jwtKey = new TextEncoder().encode(loadJwtSecret());
const sessionCookieName = 'bookky_session';
const sessionMaxAge = 60 * 60 * 8;
function sessionCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        path: '/api',
        maxAge: sessionMaxAge,
    };
}
export async function createSessionCookie(user) {
    const token = await new SignJWT({ role: user.role, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(`${sessionMaxAge}s`)
        .sign(jwtKey);
    return stringifySetCookie({
        name: sessionCookieName,
        value: token,
        ...sessionCookieOptions(),
    });
}
export function expiredSessionCookie() {
    return stringifySetCookie({
        name: sessionCookieName,
        value: '',
        ...sessionCookieOptions(),
        maxAge: 0,
    });
}
export const requireAuth = async (req, res, next) => {
    const token = parseCookie(req.headers.cookie ?? '')[sessionCookieName];
    if (!token) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    try {
        const { payload } = await jwtVerify(token, jwtKey, { algorithms: ['HS256'] });
        const userId = payload.sub;
        const user = userId ? findUserById(userId) : undefined;
        if (!user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        req.authUser = user;
        next();
    }
    catch {
        res.status(401).json({ message: 'Session expired or invalid' });
    }
};
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.authUser) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.authUser.role)) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
