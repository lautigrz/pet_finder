import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const level = process.env.LOG_LEVEL ?? 'info';
const logDir = process.env.LOG_DIR ?? 'logs';
const fileLoggingEnabled = process.env.NODE_ENV !== 'test';

const consoleFormat = format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
);

const prettyFileFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack, code, statusCode, method, path }) => {
        const ctx = [[code, statusCode].filter(Boolean).join(' '), method ? `${method} ${path}` : null]
            .filter(Boolean).join(' · ');
        const head = `${timestamp} ${level}: ${message}${ctx ? `  [${ctx}]` : ''}`;
        return stack ? `${head}\n${stack}` : head;
    })
);

const jsonFileFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
);

const fileFormat = process.env.NODE_ENV === 'production' ? jsonFileFormat : prettyFileFormat;

const rotateFile = (filename: string, fileLevel?: string) =>
    new DailyRotateFile({
        dirname: logDir,
        filename: `${filename}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: fileLevel,
        format: fileFormat,
    });

const buildTransports = () => [
    new transports.Console({ format: consoleFormat }),
    ...(fileLoggingEnabled ? [rotateFile('error', 'error'), rotateFile('combined')] : []),
];

const logger = createLogger({ level, transports: buildTransports() });

export { logger };
