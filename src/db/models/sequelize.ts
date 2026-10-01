import { Sequelize } from 'sequelize';

import { getDbSslOptions } from '../../configs/dbSsl.config';
import { dbConfig, serverConfig } from '../../configs/server.config';

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: dbConfig.DB_HOST,
    username: dbConfig.DB_USER,
    password: dbConfig.DB_PASSWORD,
    database: dbConfig.DB_NAME,
    timezone: '+05:30',
    dialectOptions: {
        ssl: getDbSslOptions()
    },
    logging: serverConfig.NODE_ENV == 'development' ? console.log : false
});

export default sequelize;