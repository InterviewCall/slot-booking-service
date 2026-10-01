import { ConnectionOptions } from 'bullmq';

import { redisAuthOptions, serverConfig } from './server.config';

export const bullMqConnection: ConnectionOptions = {
    host: serverConfig.REDIS_HOST,
    port: serverConfig.REDIS_PORT,
    maxRetriesPerRequest: null,
    ...redisAuthOptions
};