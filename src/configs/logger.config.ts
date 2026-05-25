import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { getCorrelationId } from '../utils/helpers/request.helper';
import { serverConfig } from './server.config';

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        winston.format.json(),
        winston.format.printf(({ level, message, timestamp, ...data }) => {
            const output = {
                level,
                message,
                timestamp,
                correlationId: getCorrelationId(),
                data
            };
            return JSON.stringify(output);
        })
    ),
    transports: [
        ...(serverConfig.NODE_ENV == 'development' ? [new winston.transports.Console()] : []),
        new DailyRotateFile({
            filename: 'logs/%DATE%-app.log',
            datePattern: 'DD-MM-YYYY',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

export default logger;