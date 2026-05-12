import express from 'express';
import { getLogger } from './logging/logger';

const app = express();
const logger = getLogger('http');

app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

        logger.info('HTTP request completed', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
        });
    });

    next();
});

app.use(express.json());

export default app;
