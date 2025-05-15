const http = require('http');
const { Command } = require('commander');
const fs = require('fs/promises');
const path = require('path');

const program = new Command();

program
    .requiredOption('-h, --host <host>', 'Host address')
    .requiredOption('-p, --port <port>', 'Port number')
    .requiredOption('-c, --cache <path>', 'Cache directory')

program.parse(process.argv);
const options = program.opts();

// Перевірка на існування кеш-директорії
fs.mkdir(options.cache, { recursive: true }).catch(console.error);

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Proxy server is running.');
});

server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}`);
});
