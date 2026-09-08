import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { getCorrelationId } from '../utils/helpers/request.helper';
import { serverConfig } from './server.config';


const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'DD-MM-YYYY HH:mm:ss'
    }),
    winston.format.errors({
        stack: true
    }),
    winston.format.splat(),
    winston.format.printf(
        ({ level, message, timestamp, stack, ...meta }) => {
            const correlationId = getCorrelationId();

            let log = `${timestamp} [${level}]`;

            if (correlationId) {
                log += ` [${correlationId}]`;
            }

            log += `: ${stack || message}`;

            if (Object.keys(meta).length > 0) {
                log += `\n${JSON.stringify(meta, null, 2)}`;
            }

            return log;
        }
    )
);


const fileFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'DD-MM-YYYY HH:mm:ss'
    }),
    winston.format.errors({
        stack: true
    }),
    winston.format.splat(),
    winston.format.printf(
        ({ level, message, timestamp, stack, ...data }) => {
            return JSON.stringify({
                level,
                message,
                timestamp,
                correlationId: getCorrelationId(),
                stack,
                data
            });
        }
    )
);


const logger = winston.createLogger({
    level: serverConfig.NODE_ENV === 'development'
        ? 'debug'
        : 'info',

    transports: [
        ...(serverConfig.NODE_ENV === 'development'
            ? [
                new winston.transports.Console({
                    format: consoleFormat
                })
            ]
            : []
        ),

        new DailyRotateFile({
            filename: 'logs/%DATE%-app.log',
            datePattern: 'DD-MM-YYYY',
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat
        })
    ]
});


export default logger;