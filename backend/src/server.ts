import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { seedAdminFromEnv } from './auth.store.js';
import { smartRouter } from './routes/SmartRouter.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '16kb' }));


app.use('/api', smartRouter);

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
