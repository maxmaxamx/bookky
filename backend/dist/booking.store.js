import { randomUUID } from 'node:crypto';
import { database } from './database.js';
const SLOT_TIMES = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
];
const BOOKING_DURATION_MINUTES = 120;
const MIN_LEAD_MINUTES = 60;
const TABLES = [
    { id: 'T01', seats: 2, zone: 'У окна', position: 't01' },
    { id: 'T02', seats: 2, zone: 'У окна', position: 't02' },
    { id: 'T03', seats: 2, zone: 'У окна', position: 't03' },
    { id: 'T04', seats: 4, zone: 'Основной зал', position: 't04' },
    { id: 'T05', seats: 4, zone: 'Основной зал', position: 't05' },
    { id: 'T06', seats: 4, zone: 'Основной зал', position: 't06' },
    { id: 'T07', seats: 4, zone: 'Основной зал', position: 't07' },
    { id: 'T08', seats: 6, zone: 'Основной зал', position: 't08' },
    { id: 'T09', seats: 6, zone: 'Основной зал', position: 't09' },
    { id: 'T10', seats: 8, zone: 'У камина', position: 't10' },
    { id: 'T11', seats: 8, zone: 'У камина', position: 't11' },
    { id: 'T12', seats: 10, zone: 'Отдельный зал', position: 't12' },
];
function mapBooking(row) {
    let parsedPreorder;
    if (row.preorder) {
        try {
            parsedPreorder = JSON.parse(row.preorder);
        }
        catch {
            parsedPreorder = undefined;
        }
    }
    return {
        id: row.id,
        date: row.date,
        time: row.time,
        guests: row.guests,
        tableId: row.tableId,
        name: row.name,
        phone: row.phone,
        ...(row.comment ? { comment: row.comment } : {}),
        ...(parsedPreorder && parsedPreorder.length > 0 ? { preorder: parsedPreorder } : {}),
        status: row.status,
        createdAt: row.createdAt,
        table: row.table,
    };
}
const bookingColumns = `
  id, date, time, guests, table_id AS tableId, name, phone, comment, preorder, status,
  created_at AS createdAt, table_label AS "table"
`;
function parseDateTime(date, time) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        return null;
    }
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    if (hours > 23 || minutes > 59) {
        return null;
    }
    const value = new Date(year, month - 1, day, hours, minutes);
    if (value.getFullYear() !== year || value.getMonth() !== month - 1 ||
        value.getDate() !== day) {
        return null;
    }
    return value;
}
function isClosedDay(date) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).getDay() === 1;
}
function isBookable(date, time, now = new Date()) {
    const startsAt = parseDateTime(date, time);
    return Boolean(startsAt && startsAt.getTime() >= now.getTime() + MIN_LEAD_MINUTES * 60_000);
}
function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
function conflicts(tableId, date, time, ignoreBookingId) {
    const requestedStart = toMinutes(time);
    const requestedEnd = requestedStart + BOOKING_DURATION_MINUTES;
    const activeBookings = database.prepare(`
    SELECT id, time FROM bookings
    WHERE table_id = ? AND date = ? AND status != 'Cancelled'
  `).all(tableId, date);
    return activeBookings.some((booking) => {
        if (booking.id === ignoreBookingId)
            return false;
        const existingStart = toMinutes(booking.time);
        const existingEnd = existingStart + BOOKING_DURATION_MINUTES;
        return requestedStart < existingEnd && requestedEnd > existingStart;
    });
}
export function getSlots(date, now = new Date()) {
    const parsedDate = parseDateTime(date, '12:00');
    if (!parsedDate || isClosedDay(date)) {
        return [];
    }
    return SLOT_TIMES.map((time) => {
        const tablesLeft = isBookable(date, time, now)
            ? TABLES.filter((table) => !conflicts(table.id, date, time)).length
            : 0;
        return {
            id: `${date}-${time}`,
            time,
            period: toMinutes(time) < 17 * 60 ? 'day' : 'evening',
            available: tablesLeft > 0,
            tablesLeft,
        };
    });
}
export function getTables(date, time) {
    const validSlot = SLOT_TIMES.includes(time) && parseDateTime(date, time) && !isClosedDay(date);
    return TABLES.map((table) => ({
        ...table,
        available: Boolean(validSlot && isBookable(date, time) && !conflicts(table.id, date, time)),
    }));
}
export function getAdminHallOccupancy(date, time) {
    const validSlot = SLOT_TIMES.includes(time) && parseDateTime(date, time);
    if (!validSlot || isClosedDay(date)) {
        return TABLES.map((table) => ({
            ...table,
            available: false,
        }));
    }
    const requestedStart = toMinutes(time);
    const requestedEnd = requestedStart + BOOKING_DURATION_MINUTES;
    const rows = database.prepare(`
    SELECT ${bookingColumns} FROM bookings
    WHERE date = ? AND status != 'Cancelled'
  `).all(date);
    const bookingsOnDate = rows.map(mapBooking);
    return TABLES.map((table) => {
        const activeBooking = bookingsOnDate.find((b) => {
            if (b.tableId !== table.id)
                return false;
            const bStart = toMinutes(b.time);
            const bEnd = bStart + BOOKING_DURATION_MINUTES;
            return requestedStart < bEnd && requestedEnd > bStart;
        });
        return {
            ...table,
            available: !activeBooking,
            activeBooking,
        };
    });
}
export function createBooking(input, ownerId) {
    const table = TABLES.find((item) => item.id === input.tableId);
    const startsAt = parseDateTime(input.date, input.time);
    if (!startsAt || !SLOT_TIMES.includes(input.time) || isClosedDay(input.date)) {
        throw new Error('Выберите корректную дату и время бронирования.');
    }
    if (!isBookable(input.date, input.time)) {
        throw new Error('Нельзя забронировать прошедшее или слишком близкое время.');
    }
    if (!table || !Number.isInteger(input.guests) || input.guests < 1 || input.guests > 12) {
        throw new Error('Проверьте выбранный столик и количество гостей.');
    }
    if (input.guests > table.seats) {
        throw new Error('За выбранным столиком недостаточно мест.');
    }
    const id = `BK-${randomUUID().slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const tableLabel = `Стол ${table.id}, ${table.zone.toLowerCase()}`;
    database.exec('BEGIN IMMEDIATE');
    try {
        if (conflicts(input.tableId, input.date, input.time)) {
            throw new Error('Table already occupied');
        }
        database.prepare(`
      INSERT INTO bookings (
        id, owner_id, date, time, guests, table_id, name, phone, comment,
        preorder, status, created_at, table_label
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `).run(id, ownerId, input.date, input.time, input.guests, input.tableId, input.name, input.phone, input.comment ?? null, input.preorder && input.preorder.length > 0 ? JSON.stringify(input.preorder) : null, createdAt, tableLabel);
        database.exec('COMMIT');
    }
    catch (error) {
        database.exec('ROLLBACK');
        throw error;
    }
    return getBookingById(id);
}
export function getBookings() {
    const rows = database.prepare(`
    SELECT ${bookingColumns} FROM bookings ORDER BY date, time, created_at
  `).all();
    return rows.map(mapBooking);
}
export function getBookingsForUser(ownerId) {
    const rows = database.prepare(`
    SELECT ${bookingColumns} FROM bookings
    WHERE owner_id = ? ORDER BY date DESC, time DESC, created_at DESC
  `).all(ownerId);
    return rows.map(mapBooking);
}
export function updateBookingStatus(id, status) {
    const booking = getBookingById(id);
    if (!booking) {
        throw new Error('Booking not found');
    }
    if (status !== 'Cancelled' &&
        conflicts(booking.tableId, booking.date, booking.time, booking.id)) {
        throw new Error('Table already occupied');
    }
    database.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
    return getBookingById(id);
}
export function cancelUserBooking(id, ownerId) {
    const result = database.prepare(`
    UPDATE bookings SET status = 'Cancelled'
    WHERE id = ? AND owner_id = ?
  `).run(id, ownerId);
    if (result.changes === 0) {
        throw new Error('Booking not found');
    }
    return getBookingById(id);
}
function getBookingById(id) {
    const row = database.prepare(`
    SELECT ${bookingColumns} FROM bookings WHERE id = ?
  `).get(id);
    return row ? mapBooking(row) : undefined;
}
