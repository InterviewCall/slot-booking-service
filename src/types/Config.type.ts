export type ServerConfig = {
    PORT: number
    NODE_ENV?: string
    REDIS_PORT: number,
    REDIS_HOST: string,
    LOCK_TTL: number
    CANDIDATE_FORM_DETAILS_SERVICE_BASE_URL: string
    SCHEDULER_INTERNAL_API_KEY: string
    INTERNAL_API_KEY_HEADER: string
    NOTIFICATION_SERVICE_BASE_URL: string
    INTERNAL_SERVICE_TIMEOUT_MS: number
}

export type QueueConfig = {
    JOB_ATTEMPTS: number
    RETRY_BACKOFF_MS: number
    FAILED_JOB_RETENTION_DAYS: number
    FAILED_JOB_RETENTION_COUNT: number
}

export type DBConfig = {
    DB_HOST: string
    DB_USER: string
    DB_PASSWORD: string
    DB_NAME: string
}

export type FrontendConfig = {
    ADMIN_FRONTEND_URL: string,
    CANDIDATE_FRONTEND_URL: string,
}
