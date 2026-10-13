import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
    cancelUserBooking,
    createBooking,
    getBookings,
    getBookingsForUser,
    getSlots,
    getTables,
    updateBookingStatus,
    type BookingRequest,
    type BookingStatus,
} from './booking.store.js';
import {
    createSessionCookie,
    expiredSessionCookie,
    requireAuth,
    requireRole,
} from './auth.js';
import {
    findUserByEmail,
    registerUser,
    seedAdminFromEnv,
    verifyPassword,
} from './auth.store.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.post('/api/auth/register', async (req, res) => {
    const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
        res.status(400).json({ message: 'Укажите email и пароль.' });
        return;
    }
    const email = body.email.trim().toLowerCase();
    const password = body.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        password.length < 8 || Buffer.byteLength(password) > 72) {
        res.status(400).json({ message: 'Проверьте email и пароль (не менее 8 символов).' });
        return;
    }
    try {
        const user = await registerUser(email, password);
        res.setHeader('Set-Cookie', await createSessionCookie(user));
        res.status(201).json(user);
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        res.status(message === 'Email already registered' ? 409 : 400).json({
            message: message === 'Email already registered'
                ? 'Аккаунт с таким email уже существует.'
                : 'Не удалось создать аккаунт.',
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
        res.status(400).json({ message: 'Укажите email и пароль.' });
        return;
    }
    const user = findUserByEmail(body.email);
    if (!user || !(await verifyPassword(user, body.password))) {
        res.status(401).json({ message: 'Неверный email или пароль.' });
        return;
    }
    const { passwordHash: _passwordHash, ...publicUser } = user;
    res.setHeader('Set-Cookie', await createSessionCookie(publicUser));
    res.json(publicUser);
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json(req.authUser);
});

app.post('/api/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', expiredSessionCookie());
    res.status(204).end();
});

app.get('/api/message', (req, res) => {
    res.json({ text: 'Привет из Express + TypeScript!' });
});

app.get('/api/bookings/slots', (req, res) => {
    const date = req.query['date'];
    if (typeof date !== 'string') {
        res.status(400).json({ message: 'Укажите дату в формате YYYY-MM-DD.' });
        return;
    }
    res.json(getSlots(date));
});

app.get('/api/tables/availability', (req, res) => {
    const date = req.query['date'];
    const time = req.query['time'];
    if (typeof date !== 'string' || typeof time !== 'string') {
        res.status(400).json({ message: 'Укажите дату и время бронирования.' });
        return;
    }
    res.json(getTables(date, time));
});

app.get('/api/bookings', requireAuth, requireRole('admin'), (_req, res) => {
    res.json(getBookings());
});

app.get('/api/bookings/mine', requireAuth, requireRole('user'), (req, res) => {
    res.json(getBookingsForUser(req.authUser!.id));
});

app.post('/api/bookings', requireAuth, requireRole('user'), (req, res) => {
    const body = (req.body ?? {}) as Partial<BookingRequest>;
    if (
        typeof body.date !== 'string' || typeof body.time !== 'string' ||
        typeof body.tableId !== 'string' || typeof body.name !== 'string' ||
        typeof body.phone !== 'string' || typeof body.guests !== 'number'
    ) {
        res.status(400).json({ message: 'Заполните все обязательные данные бронирования.' });
        return;
    }

    const name = body.name.trim();
    const phone = body.phone.trim();
    const comment = typeof body.comment === 'string' ? body.comment.trim() : undefined;
    if (name.length < 2 || name.length > 40 || !/^\+?\d[\d\s()-]{8,18}$/.test(phone) ||
        phone.replace(/\D/g, '').length !== 11 ||
        (comment !== undefined && comment.length > 200)) {
        res.status(400).json({ message: 'Проверьте имя, телефон и комментарий.' });
        return;
    }

    try {
        const booking = createBooking({
            date: body.date,
            time: body.time,
            tableId: body.tableId,
            guests: body.guests,
            name,
            phone,
            ...(comment ? { comment } : {}),
        }, req.authUser!.id);
        res.status(201).json(booking);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось создать бронирование.';
        res.status(message === 'Table already occupied' ? 409 : 400).json({ message });
    }
});

app.patch('/api/bookings/:id/status', requireAuth, requireRole('admin'), (req, res) => {
    const status = req.body?.status;
    if (status !== 'Pending' && status !== 'Confirmed' && status !== 'Cancelled') {
        res.status(400).json({ message: 'Укажите корректный статус бронирования.' });
        return;
    }

    try {
        res.json(updateBookingStatus(String(req.params['id']), status as BookingStatus));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось изменить статус.';
        const statusCode = message === 'Booking not found' ? 404 : 409;
        res.status(statusCode).json({ message });
    }
});

app.patch('/api/bookings/:id/cancel', requireAuth, requireRole('user'), (req, res) => {
    try {
        res.json(cancelUserBooking(String(req.params['id']), req.authUser!.id));
    } catch {
        res.status(404).json({ message: 'Бронирование не найдено.' });
    }
});

async function start(): Promise<void> {
    await seedAdminFromEnv();
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
}

start().catch((error: unknown) => {
    console.error('Не удалось запустить сервер:', error);
    process.exitCode = 1;
});
