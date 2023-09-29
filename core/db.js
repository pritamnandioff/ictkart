require('dotenv').config();
const dbConfig = require('../config/db.config');
var mongoose = require("mongoose");
var username = dbConfig.DB_USERNAME;
var password = dbConfig.DB_PASSWORD;
const server = dbConfig.DB_HOST;
const dbport = dbConfig.DB_PORT;
const database = dbConfig.DB_NAME;
class Database {
    constructor() {
        this._connect();
    }
    _connect() {
        mongoose
            .connect(`mongodb://${server}:${dbport}/${database}`, {
                ...(process.env.ENVIRONMENT != 'local' && {
                    auth: {
                        user: username,
                        password: password
                    }
                }),
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: true,
            })
            .then(() => {
                console.log("Database connected successful" + (process.env.DEBUG == '1' ? `====mongodb://${server}:${dbport}/${database}` : ''));
            })
            .catch(err => {
                console.error("Database connection error::" + err);
            });
    }
}
module.exports = new Database();
// db.needs.drop()