import { Sequelize } from 'sequelize';

import { dbConfig, serverConfig } from '../../configs/server.config';

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: dbConfig.DB_HOST,
    username: dbConfig.DB_USER,
    password: dbConfig.DB_PASSWORD,
    database: dbConfig.DB_NAME,
    timezone: '+05:30',
    logging: serverConfig.NODE_ENV == 'development' ? console.log : false
});

export default sequelize;