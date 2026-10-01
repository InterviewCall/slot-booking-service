const fs = require('fs');

const dotenv = require('dotenv');

dotenv.config();

// RDS: encrypt the connection and verify the server against the AWS CA bundle (DB_SSL=true)
const dialectOptions = process.env.DB_SSL === 'true'
    ? {
        ssl: {
            ca: fs.readFileSync(process.env.DB_SSL_CA_PATH || '/app/certs/rds-global-bundle.pem', 'utf-8'),
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        }
    }
    : {};

const config = {
    development: {
        username: process.env.DEV_DB_USER,
        password: process.env.DEV_DB_PASSWORD,
        database: process.env.DEV_DB_NAME,
        host: process.env.DEV_DB_HOST,
        dialect: 'mysql',
    },

    // Production falls back to the same DB_* variables the application itself uses
    production: {
        username: process.env.PROD_DB_USER || process.env.DB_USER,
        password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
        database: process.env.PROD_DB_NAME || process.env.DB_NAME,
        host: process.env.PROD_DB_HOST || process.env.DB_HOST,
        dialect: 'mysql',
        dialectOptions,
    }
};

module.exports = config;
