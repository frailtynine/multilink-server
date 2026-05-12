"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
exports.resolveLogLevel = resolveLogLevel;
exports.setupLogging = setupLogging;
exports.setupLoggingFromEnv = setupLoggingFromEnv;
exports.getLogger = getLogger;
const node_buffer_1 = require("node:buffer");
var LogLevel;
(function (LogLevel) {
    LogLevel["NOTSET"] = "NOTSET";
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["FATAL"] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const LOG_LEVEL_PRIORITIES = {
    [LogLevel.NOTSET]: 0,
    [LogLevel.DEBUG]: 10,
    [LogLevel.INFO]: 20,
    [LogLevel.WARNING]: 30,
    [LogLevel.ERROR]: 40,
    [LogLevel.FATAL]: 50,
};
let currentConfig = {
    appName: 'multilink-server',
    level: LogLevel.INFO,
    lokiUrl: undefined,
    lokiUser: undefined,
    lokiApiKey: undefined,
};
let lokiFailureLogged = false;
function formatTimestamp(date) {
    return date.toISOString().replace('T', ' ').slice(0, 19);
}
function serializeError(error) {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
    };
}
function normalizeContext(context) {
    if (!context) {
        return undefined;
    }
    return Object.fromEntries(Object.entries(context).map(([key, value]) => {
        if (value instanceof Error) {
            return [key, serializeError(value)];
        }
        return [key, value];
    }));
}
function shouldLog(level) {
    return LOG_LEVEL_PRIORITIES[level] >= LOG_LEVEL_PRIORITIES[currentConfig.level];
}
function getConsoleMethod(level) {
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
        return console.error;
    }
    if (level === LogLevel.WARNING) {
        return console.warn;
    }
    return console.log;
}
function formatLogLine(entry) {
    const contextSuffix = entry.context ? ` - ${JSON.stringify(entry.context)}` : '';
    return `${entry.timestamp} - ${entry.logger} - ${entry.level} - ${entry.message}${contextSuffix}`;
}
async function sendToLoki(entry) {
    const { lokiUrl, lokiUser, lokiApiKey, appName } = currentConfig;
    if (!lokiUrl || !lokiUser || !lokiApiKey) {
        return;
    }
    const response = await fetch(`${lokiUrl.replace(/\/$/, '')}/loki/api/v1/push`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${node_buffer_1.Buffer.from(`${lokiUser}:${lokiApiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            streams: [
                {
                    stream: {
                        application: appName,
                        logger: entry.logger,
                        level: entry.level,
                    },
                    values: [[`${BigInt(Date.now()) * 1000000n}`, JSON.stringify(entry)]],
                },
            ],
        }),
    });
    if (!response.ok) {
        throw new Error(`Loki push failed with status ${response.status}`);
    }
}
class AppLogger {
    constructor(name) {
        this.name = name;
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARNING, message, context);
    }
    error(message, context) {
        this.log(LogLevel.ERROR, message, context);
    }
    fatal(message, context) {
        this.log(LogLevel.FATAL, message, context);
    }
    log(level, message, context) {
        if (!shouldLog(level)) {
            return;
        }
        const entry = {
            timestamp: formatTimestamp(new Date()),
            logger: this.name,
            level,
            message,
            context: normalizeContext(context),
        };
        getConsoleMethod(level)(formatLogLine(entry));
        void sendToLoki(entry).catch((error) => {
            if (lokiFailureLogged) {
                return;
            }
            lokiFailureLogged = true;
            console.warn(`${formatTimestamp(new Date())} - ${this.name} - ${LogLevel.WARNING} - Failed to push logs to Loki`, error);
        });
    }
}
function resolveLogLevel(level) {
    switch (level?.toUpperCase()) {
        case LogLevel.NOTSET:
            return LogLevel.NOTSET;
        case LogLevel.DEBUG:
            return LogLevel.DEBUG;
        case LogLevel.INFO:
            return LogLevel.INFO;
        case 'WARN':
        case LogLevel.WARNING:
            return LogLevel.WARNING;
        case LogLevel.ERROR:
            return LogLevel.ERROR;
        case 'CRITICAL':
        case LogLevel.FATAL:
            return LogLevel.FATAL;
        default:
            return LogLevel.INFO;
    }
}
function setupLogging(options = {}) {
    currentConfig = {
        appName: options.appName ?? currentConfig.appName,
        level: options.level ?? currentConfig.level,
        lokiUrl: options.lokiUrl,
        lokiUser: options.lokiUser,
        lokiApiKey: options.lokiApiKey,
    };
    lokiFailureLogged = false;
}
function setupLoggingFromEnv() {
    setupLogging({
        appName: process.env.APP_NAME ?? 'multilink-server',
        level: resolveLogLevel(process.env.LOG_LEVEL),
        lokiUrl: process.env.LOKI_URL,
        lokiUser: process.env.LOKI_USER,
        lokiApiKey: process.env.LOKI_API_KEY,
    });
}
function getLogger(name = 'multilink-server') {
    return new AppLogger(name);
}
