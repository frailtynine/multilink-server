import assert from 'node:assert/strict';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import { getLogger, LogLevel, resolveLogLevel, setupLogging } from '../../src/logging/logger';

test('resolveLogLevel supports known values and defaults to INFO', () => {
    assert.equal(resolveLogLevel('debug'), LogLevel.DEBUG);
    assert.equal(resolveLogLevel('warn'), LogLevel.WARNING);
    assert.equal(resolveLogLevel('fatal'), LogLevel.FATAL);
    assert.equal(resolveLogLevel('unexpected'), LogLevel.INFO);
});

test('logger respects configured log level', async () => {
    const originalLog = console.log;
    const originalError = console.error;
    const messages: string[] = [];

    console.log = (message?: unknown) => {
        messages.push(String(message));
    };
    console.error = (message?: unknown) => {
        messages.push(String(message));
    };

    try {
        setupLogging({ level: LogLevel.ERROR });
        const logger = getLogger('test');

        logger.info('should not log');
        logger.error('should log');

        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(messages.some((message) => message.includes('should not log')), false);
        assert.equal(messages.some((message) => message.includes('should log')), true);
    } finally {
        console.log = originalLog;
        console.error = originalError;
        setupLogging({ level: LogLevel.INFO });
    }
});

test('logger pushes to Loki when configured', async () => {
    const originalFetch = globalThis.fetch;
    const originalLog = console.log;
    const originalWarn = console.warn;
    const requests: { url: string; init?: RequestInit }[] = [];

    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        requests.push({ url: String(input), init });

        return new Response(null, { status: 204 });
    };
    console.log = () => {};
    console.warn = () => {};

    try {
        setupLogging({
            appName: 'multilink-server',
            level: LogLevel.INFO,
            lokiUrl: 'https://logs.example.com',
            lokiUser: 'user-id',
            lokiApiKey: 'api-key',
        });

        getLogger('test').info('hello loki', { scope: 'unit-test' });

        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, 'https://logs.example.com/loki/api/v1/push');
        assert.equal(
            (requests[0].init?.headers as Record<string, string>).Authorization,
            `Basic ${Buffer.from('user-id:api-key').toString('base64')}`,
        );
        const parsedBody = JSON.parse(String(requests[0].init?.body)) as {
            streams: Array<{
                stream: { application: string };
                values: [string, string][];
            }>;
        };
        const [, serializedEntry] = parsedBody.streams[0].values[0];
        const parsedEntry = JSON.parse(serializedEntry) as { message: string };

        assert.equal(parsedBody.streams[0].stream.application, 'multilink-server');
        assert.equal(parsedEntry.message, 'hello loki');
    } finally {
        globalThis.fetch = originalFetch;
        console.log = originalLog;
        console.warn = originalWarn;
        setupLogging({ level: LogLevel.INFO });
    }
});
