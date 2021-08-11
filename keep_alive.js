const http = require('http');


exports.startup = function startup() {
    const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('ok');
    });
    server.listen(3000);
}
