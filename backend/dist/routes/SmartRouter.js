import { Router } from 'express';
import { cancelUserBooking, createBooking, getAdminHallOccupancy, getBookings, getBookingsForUser, getSlots, getTables, updateBookingStatus, } from '../booking.store.js';
import { getMenuItems, validateAndSanitizePreorder, } from '../menu.store.js';
import { createSessionCookie, expiredSessionCookie, requireAuth, requireRole, } from '../auth.js';
import { findUserByEmail, registerUser, verifyPassword, } from '../auth.store.js';
export const smartRouter = Router();
// --- Авторизация и сессии ---------------------------------------------------
smartRouter.post('/auth/register', async (req, res) => {
    const body = (req.body ?? {});
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '';
        res.status(message === 'Email already registered' ? 409 : 400).json({
            message: message === 'Email already registered'
                ? 'Аккаунт с таким email уже существует.'
                : 'Не удалось создать аккаунт.',
        });
    }
});
smartRouter.post('/auth/login', async (req, res) => {
    const body = (req.body ?? {});
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
smartRouter.get('/auth/me', requireAuth, (req, res) => {
    res.json(req.authUser);
});
smartRouter.post('/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', expiredSessionCookie());
    res.status(204).end();
});
// --- Общие эндпоинты --------------------------------------------------------
smartRouter.get('/message', (_req, res) => {
    res.json({ text: 'Привет из Express + TypeScript!' });
});
smartRouter.get('/menu', (_req, res) => {
    res.json(getMenuItems());
});
// --- Бронирование: слоты и столики ------------------------------------------
smartRouter.get('/bookings/slots', (req, res) => {
    const date = req.query['date'];
    if (typeof date !== 'string') {
        res.status(400).json({ message: 'Укажите дату в формате YYYY-MM-DD.' });
        return;
    }
    res.json(getSlots(date));
});
smartRouter.get('/tables/availability', (req, res) => {
    const date = req.query['date'];
    const time = req.query['time'];
    if (typeof date !== 'string' || typeof time !== 'string') {
        res.status(400).json({ message: 'Укажите дату и время бронирования.' });
        return;
    }
    res.json(getTables(date, time));
});
// --- Администрирование ------------------------------------------------------
smartRouter.get('/admin/hall-status', requireAuth, requireRole('admin'), (req, res) => {
    const date = req.query['date'];
    const time = req.query['time'];
    if (typeof date !== 'string' || typeof time !== 'string') {
        res.status(400).json({ message: 'Укажите дату и время для просмотра зала.' });
        return;
    }
    res.json(getAdminHallOccupancy(date, time));
});
smartRouter.get('/bookings', requireAuth, requireRole('admin'), (_req, res) => {
    res.json(getBookings());
});
smartRouter.patch('/bookings/:id/status', requireAuth, requireRole('admin'), (req, res) => {
    const status = req.body?.status;
    if (status !== 'Pending' && status !== 'Confirmed' && status !== 'Cancelled') {
        res.status(400).json({ message: 'Укажите корректный статус бронирования.' });
        return;
    }
    try {
        res.json(updateBookingStatus(String(req.params['id']), status));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось изменить статус.';
        const statusCode = message === 'Booking not found' ? 404 : 409;
        res.status(statusCode).json({ message });
    }
});
// --- Бронирования пользователя ----------------------------------------------
smartRouter.get('/bookings/mine', requireAuth, requireRole('user'), (req, res) => {
    res.json(getBookingsForUser(req.authUser.id));
});
smartRouter.post('/bookings', requireAuth, requireRole('user'), (req, res) => {
    const body = (req.body ?? {});
    if (typeof body.date !== 'string' || typeof body.time !== 'string' ||
        typeof body.tableId !== 'string' || typeof body.name !== 'string' ||
        typeof body.phone !== 'string' || typeof body.guests !== 'number') {
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
    const preorder = validateAndSanitizePreorder(body.preorder);
    try {
        const booking = createBooking({
            date: body.date,
            time: body.time,
            tableId: body.tableId,
            guests: body.guests,
            name,
            phone,
            ...(comment ? { comment } : {}),
            ...(preorder ? { preorder } : {}),
        }, req.authUser.id);
        res.status(201).json(booking);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось создать бронирование.';
        res.status(message === 'Table already occupied' ? 409 : 400).json({ message });
    }
});
smartRouter.patch('/bookings/:id/cancel', requireAuth, requireRole('user'), (req, res) => {
    try {
        res.json(cancelUserBooking(String(req.params['id']), req.authUser.id));
    }
    catch {
        res.status(404).json({ message: 'Бронирование не найдено.' });
    }
});
export { smartRouter as SmartRouter };
export default smartRouter;
