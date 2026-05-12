import { Buffer } from 'node:buffer';

export enum LogLevel {
    NOTSET = 'NOTSET',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    FATAL = 'FATAL',
}

type LogContext = Record<string, unknown>;

interface LoggingOptions {
    appName?: string;
    level?: LogLevel;
    lokiUrl?: string;
    lokiUser?: string;
    lokiApiKey?: string;
}

interface LogEntry {
    timestamp: string;
    logger: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
}

const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
    [LogLevel.NOTSET]: 0,
    [LogLevel.DEBUG]: 10,
    [LogLevel.INFO]: 20,
    [LogLevel.WARNING]: 30,
    [LogLevel.ERROR]: 40,
    [LogLevel.FATAL]: 50,
};

let currentConfig: Required<Pick<LoggingOptions, 'appName' | 'level'>> & Omit<LoggingOptions, 'appName' | 'level'> = {
    appName: 'multilink-server',
    level: LogLevel.INFO,
    lokiUrl: undefined,
    lokiUser: undefined,
    lokiApiKey: undefined,
};

let lokiFailureLogged = false;

function formatTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').slice(0, 19);
}

function serializeError(error: Error): LogContext {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
    };
}

function normalizeContext(context?: LogContext): LogContext | undefined {
    if (!context) {
        return undefined;
    }

    return Object.fromEntries(
        Object.entries(context).map(([key, value]) => {
            if (value instanceof Error) {
                return [key, serializeError(value)];
            }

            return [key, value];
        }),
    );
}

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITIES[level] >= LOG_LEVEL_PRIORITIES[currentConfig.level];
}

function getConsoleMethod(level: LogLevel): (...data: unknown[]) => void {
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
        return console.error;
    }

    if (level === LogLevel.WARNING) {
        return console.warn;
    }

    return console.log;
}

function formatLogLine(entry: LogEntry): string {
    const contextSuffix = entry.context ? ` - ${JSON.stringify(entry.context)}` : '';

    return `${entry.timestamp} - ${entry.logger} - ${entry.level} - ${entry.message}${contextSuffix}`;
}

async function sendToLoki(entry: LogEntry): Promise<void> {
    const { lokiUrl, lokiUser, lokiApiKey, appName } = currentConfig;

    if (!lokiUrl || !lokiUser || !lokiApiKey) {
        return;
    }

    const response = await fetch(`${lokiUrl.replace(/\/$/, '')}/loki/api/v1/push`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${lokiUser}:${lokiApiKey}`).toString('base64')}`,
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
    public constructor(private readonly name: string) {}

    public debug(message: string, context?: LogContext): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    public info(message: string, context?: LogContext): void {
        this.log(LogLevel.INFO, message, context);
    }

    public warn(message: string, context?: LogContext): void {
        this.log(LogLevel.WARNING, message, context);
    }

    public error(message: string, context?: LogContext): void {
        this.log(LogLevel.ERROR, message, context);
    }

    public fatal(message: string, context?: LogContext): void {
        this.log(LogLevel.FATAL, message, context);
    }

    private log(level: LogLevel, message: string, context?: LogContext): void {
        if (!shouldLog(level)) {
            return;
        }

        const entry: LogEntry = {
            timestamp: formatTimestamp(new Date()),
            logger: this.name,
            level,
            message,
            context: normalizeContext(context),
        };

        getConsoleMethod(level)(formatLogLine(entry));

        void sendToLoki(entry).catch((error: unknown) => {
            if (lokiFailureLogged) {
                return;
            }

            lokiFailureLogged = true;
            console.warn(
                `${formatTimestamp(new Date())} - ${this.name} - ${LogLevel.WARNING} - Failed to push logs to Loki`,
                error,
            );
        });
    }
}

export function resolveLogLevel(level?: string): LogLevel {
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

export function setupLogging(options: LoggingOptions = {}): void {
    currentConfig = {
        appName: options.appName ?? currentConfig.appName,
        level: options.level ?? currentConfig.level,
        lokiUrl: options.lokiUrl,
        lokiUser: options.lokiUser,
        lokiApiKey: options.lokiApiKey,
    };
    lokiFailureLogged = false;
}

export function setupLoggingFromEnv(): void {
    setupLogging({
        appName: process.env.APP_NAME ?? 'multilink-server',
        level: resolveLogLevel(process.env.LOG_LEVEL),
        lokiUrl: process.env.LOKI_URL,
        lokiUser: process.env.LOKI_USER,
        lokiApiKey: process.env.LOKI_API_KEY,
    });
}

export function getLogger(name = 'multilink-server'): AppLogger {
    return new AppLogger(name);
}
