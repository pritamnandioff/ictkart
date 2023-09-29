require('dotenv').config();
let confObj = {
    local: require('./local-db.config'),
    stage: require('./stag-db.config'),
    prod: require('./prod-db.config')
}
module.exports = confObj[process.env.ENVIRONMENT]