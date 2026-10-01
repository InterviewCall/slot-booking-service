import fs from 'fs';

import { dbConfig } from './server.config';

/**
 * TLS options for the MySQL connection (RDS). Undefined when DB_SSL is not enabled (local development).
 * The server certificate is verified against the CA bundle at DB_SSL_CA_PATH.
 */
export function getDbSslOptions(): { ca: string, minVersion: 'TLSv1.2', rejectUnauthorized: true } | undefined {
    if(!dbConfig.DB_SSL) {
        return undefined;
    }

    return {
        ca: fs.readFileSync(dbConfig.DB_SSL_CA_PATH, 'utf-8'),
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    };
}
