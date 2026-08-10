import Redis from 'ioredis';
import { createLock,IoredisAdapter } from 'redlock-universal';

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

const redisAdapter = new IoredisAdapter(getRedisClient());

export function createDistributedLock(key: string, ttl: number) {
    return createLock({
        adapter: redisAdapter,
        key,
        ttl,
        retryAttempts: 1,
        retryDelay: 200
    });
}