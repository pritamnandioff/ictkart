var cluster = require("cluster");
const app = require('./app');
const server = require('https');
const http = require('http');
const fs = require("fs");
const cors = require("cors");
var port = process.env.PORT || 8182;
if (cluster.isMaster) {
    var numWorkers = require("os").cpus().length;
    for (var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }
    cluster.on("online", function (worker) {
        // console.log("Worker " + worker.process.pid + " is online");
    });
    cluster.on("exit", function (worker, code, signal) {
        cluster.fork();
    });
}
else {
    var privateKey = fs.readFileSync('./ssl/ictkrt_api.key');
    var certificate = fs.readFileSync('./ssl/ictkrt_app.crt');
    var ca = fs.readFileSync('./ssl/ictkart_bundal.ca-bundle');
    var keyPem = fs.readFileSync('./ssl/live-api.pem');
    var credentials = {
        cert: certificate,
        key: privateKey
    };
    app.use(cors());
    var httpsServer = server.createServer(credentials, app);
    httpsServer.listen(port, () => {
        console.log("HTTP Server is up and running on port numner " + port);
    });
    /**
    http.listen(port, () => {
        console.log("HTTP Server is up and running on port numner " + port);
    });
    */
}