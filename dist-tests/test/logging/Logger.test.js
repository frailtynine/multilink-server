"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const node_buffer_1 = require("node:buffer");
const logger_1 = require("../../src/logging/logger");
(0, node_test_1.default)('resolveLogLevel supports known values and defaults to INFO', () => {
    strict_1.default.equal((0, logger_1.resolveLogLevel)('debug'), logger_1.LogLevel.DEBUG);
    strict_1.default.equal((0, logger_1.resolveLogLevel)('warn'), logger_1.LogLevel.WARNING);
    strict_1.default.equal((0, logger_1.resolveLogLevel)('fatal'), logger_1.LogLevel.FATAL);
    strict_1.default.equal((0, logger_1.resolveLogLevel)('unexpected'), logger_1.LogLevel.INFO);
});
(0, node_test_1.default)('logger respects configured log level', async () => {
    const originalLog = console.log;
    const originalError = console.error;
    const messages = [];
    console.log = (message) => {
        messages.push(String(message));
    };
    console.error = (message) => {
        messages.push(String(message));
    };
    try {
        (0, logger_1.setupLogging)({ level: logger_1.LogLevel.ERROR });
        const logger = (0, logger_1.getLogger)('test');
        logger.info('should not log');
        logger.error('should log');
        await new Promise((resolve) => setTimeout(resolve, 0));
        strict_1.default.equal(messages.some((message) => message.includes('should not log')), false);
        strict_1.default.equal(messages.some((message) => message.includes('should log')), true);
    }
    finally {
        console.log = originalLog;
        console.error = originalError;
        (0, logger_1.setupLogging)({ level: logger_1.LogLevel.INFO });
    }
});
(0, node_test_1.default)('logger pushes to Loki when configured', async () => {
    const originalFetch = globalThis.fetch;
    const originalLog = console.log;
    const originalWarn = console.warn;
    const requests = [];
    globalThis.fetch = async (input, init) => {
        requests.push({ url: String(input), init });
        return new Response(null, { status: 204 });
    };
    console.log = () => { };
    console.warn = () => { };
    try {
        (0, logger_1.setupLogging)({
            appName: 'multilink-server',
            level: logger_1.LogLevel.INFO,
            lokiUrl: 'https://logs.example.com',
            lokiUser: 'user-id',
            lokiApiKey: 'api-key',
        });
        (0, logger_1.getLogger)('test').info('hello loki', { scope: 'unit-test' });
        await new Promise((resolve) => setTimeout(resolve, 0));
        strict_1.default.equal(requests.length, 1);
        strict_1.default.equal(requests[0].url, 'https://logs.example.com/loki/api/v1/push');
        strict_1.default.equal((requests[0].init?.headers).Authorization, `Basic ${node_buffer_1.Buffer.from('user-id:api-key').toString('base64')}`);
        const parsedBody = JSON.parse(String(requests[0].init?.body));
        const [, serializedEntry] = parsedBody.streams[0].values[0];
        const parsedEntry = JSON.parse(serializedEntry);
        strict_1.default.equal(parsedBody.streams[0].stream.application, 'multilink-server');
        strict_1.default.equal(parsedEntry.message, 'hello loki');
    }
    finally {
        globalThis.fetch = originalFetch;
        console.log = originalLog;
        console.warn = originalWarn;
        (0, logger_1.setupLogging)({ level: logger_1.LogLevel.INFO });
    }
});
