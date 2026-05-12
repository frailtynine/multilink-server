import 'dotenv/config';
import app from './app';
import { getLogger, setupLoggingFromEnv } from './logging/logger';

const port = Number(process.env.PORT ?? 3000);
setupLoggingFromEnv();
const logger = getLogger('server');

if (Number.isNaN(port)) {
    throw new Error('PORT must be a valid number');
}

app.listen(port, () => {
    logger.info('Server started', {
        port,
        url: `http://localhost:${port}`,
    });
});
