import { Redlock } from '@sesamecare-oss/redlock';
import Redis from 'ioredis';

// import Redlock, { CompatibleRedisClient } from 'redlock';
import { InternalServerError } from '../utils/errors/app.error';
import logger from './logger.config';
import { serverConfig } from './server.config';

let connection: Redis | undefined = undefined;

function createRedisConnection(): Redis {

    const redisConfig = {
        port: serverConfig.REDIS_PORT,
        host: serverConfig.REDIS_HOST,
        maxRetriesPerRequest: 3
    };

    const redis = new Redis(redisConfig);

    redis.on('connect', () => {
        logger.info('Redis connection established');
    });

    redis.on('ready', () => {
        logger.info('Redis is ready');
    });

    redis.on('error', (error) => {
        logger.error('Redis connection error', { error });
    });

    redis.on('close', () => {
        logger.warn('Redis connection closed');
    });

    redis.on('reconnecting', () => {
        logger.warn('Redis reconnecting...');
    });

    return redis;
}

export function getRedisClient(): Redis {
    try {
        if(!connection) {
            connection = createRedisConnection();
        }

        return connection;
    } catch (error) {
        logger.error('Error creating Redis client', { error });
        throw new InternalServerError('Error connecting to Redis');
    }
}

export const redlock = new Redlock([getRedisClient()], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200
});