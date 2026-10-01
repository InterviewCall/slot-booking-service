import dotenv from 'dotenv';

type ServerConfig = {
    PORT: number
    NODE_ENV?: string
    REDIS_PORT: number,
    REDIS_HOST: string,
    REDIS_PASSWORD?: string,
    REDIS_TLS: boolean,
    LOCK_TTL: number
    CANDIDATE_FORM_DETAILS_SERVICE_BASE_URL: string
    SCHEDULER_INTERNAL_API_KEY: string
    INTERNAL_API_KEY_HEADER: string
    TRUST_PROXY: number
    SLOT_WINDOW_DAYS: number
}

type RateLimitConfig = {
    WINDOW_MS: number
    MAX_REQUESTS: number
    WRITE_MAX_REQUESTS: number
}

type QueueConfig = {
    JOB_ATTEMPTS: number
    RETRY_BACKOFF_MS: number
    FAILED_JOB_RETENTION_DAYS: number
    FAILED_JOB_RETENTION_COUNT: number
}

type DBConfig = {
    DB_HOST: string
    DB_USER: string
    DB_PASSWORD: string
    DB_NAME: string
    DB_SSL: boolean
    DB_SSL_CA_PATH: string
}

type FrontendConfig = {
    ADMIN_FRONTEND_URL: string,
    CANDIDATE_FRONTEND_URL: string,
}

dotenv.config();

export const serverConfig: ServerConfig =  {
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
    // Managed Redis (ElastiCache) runs with an auth token and in-transit encryption
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    REDIS_TLS: process.env.REDIS_TLS == 'true',
    LOCK_TTL: Number(process.env.LOCK_TTL) || 50000,
    CANDIDATE_FORM_DETAILS_SERVICE_BASE_URL: process.env.CANDIDATE_FORM_DETAILS_SERVICE_BASE_URL || 'http://localhost:3000/api/v1',
    SCHEDULER_INTERNAL_API_KEY: process.env.SCHEDULER_INTERNAL_API_KEY || '',
    INTERNAL_API_KEY_HEADER: process.env.INTERNAL_API_KEY_HEADER || '',
    // Number of reverse proxies (Caddy, ...) sitting in front of the app; needed so req.ip is the real client IP
    TRUST_PROXY: Number(process.env.TRUST_PROXY ?? 1),
    // How many days ahead bookable dates/slots are kept generated (rolling window)
    SLOT_WINDOW_DAYS: Number(process.env.SLOT_WINDOW_DAYS) || 90
};

// Connection options shared by every Redis client (ioredis, BullMQ, locks)
export const redisAuthOptions = {
    ...(serverConfig.REDIS_PASSWORD ? { password: serverConfig.REDIS_PASSWORD } : {}),
    ...(serverConfig.REDIS_TLS ? { tls: {} } : {})
};

// Limits are per client IP. Kept generous on purpose: many candidates share one public IP
// (college Wi-Fi, mobile carrier NAT) and this is an open, unauthenticated funnel.
export const rateLimitConfig: RateLimitConfig = {
    WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX) || 600,
    WRITE_MAX_REQUESTS: Number(process.env.RATE_LIMIT_WRITE_MAX) || 60
};

// Job retry / retention policy for the notification queue this service produces into.
// Keep in sync with the notification service: a job's own options win over the worker's.
//  - a job that succeeds is deleted from Redis immediately
//  - a job that fails is retried JOB_ATTEMPTS times in total (exponential backoff starting at RETRY_BACKOFF_MS)
//  - once all attempts are used it stays in the "failed" set for FAILED_JOB_RETENTION_DAYS (max FAILED_JOB_RETENTION_COUNT)
export const queueConfig: QueueConfig = {
    JOB_ATTEMPTS: Number(process.env.QUEUE_JOB_ATTEMPTS) || 5,
    RETRY_BACKOFF_MS: Number(process.env.QUEUE_RETRY_BACKOFF_MS) || 30 * 1000,
    FAILED_JOB_RETENTION_DAYS: Number(process.env.QUEUE_FAILED_RETENTION_DAYS) || 1,
    FAILED_JOB_RETENTION_COUNT: Number(process.env.QUEUE_FAILED_RETENTION_COUNT) || 5000
};

export const dbConfig: DBConfig = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'ic_lead_booking',
    // RDS: encrypt the connection and verify the server against the AWS CA bundle
    DB_SSL: process.env.DB_SSL == 'true',
    DB_SSL_CA_PATH: process.env.DB_SSL_CA_PATH || '/app/certs/rds-global-bundle.pem'
};

export const frontendConfig: FrontendConfig = {
    ADMIN_FRONTEND_URL: String(process.env.ADMIN_FRONTEND_URL),
    CANDIDATE_FRONTEND_URL: String(process.env.CANDIDATE_FRONTEND_URL)
};