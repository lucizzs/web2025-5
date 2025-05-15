const http = require('http');
const { Command } = require('commander');
const fs = require('fs/promises');
const { createReadStream, createWriteStream } = require('fs');
const path = require('path');
const url = require('url');
const superagent = require('superagent');


const program = new Command();

program
    .requiredOption('-h, --host <host>', 'Host address')
    .requiredOption('-p, --port <port>', 'Port number')
    .requiredOption('-c, --cache <path>', 'Cache directory');

program.parse(process.argv);
const options = program.opts();

// Гарантуємо, що кеш-директорія існує
fs.mkdir(options.cache, { recursive: true }).catch(console.error);

// Створення HTTP-сервера
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const code = parsedUrl.pathname.slice(1); // /200 → "200"
    const filePath = path.join(options.cache, `${code}.jpg`);

    if (!/^\d+$/.test(code)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Bad request. Use path like /200');
    }

    switch (req.method) {
        case 'GET':
            try {
                // Перевіряємо, чи файл вже є в кеші
                await fs.access(filePath);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                createReadStream(filePath).pipe(res);
            } catch {
                // Якщо немає — завантажуємо з http.cat
                try {
                    const response = await superagent.get(`https://http.cat/${code}`);
                    await fs.writeFile(filePath, response.body); // зберігаємо в кеш
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(response.body); // відправляємо відповідь
                } catch (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Image not found on http.cat');
                }
            }
            break;

        case 'PUT':
            const writeStream = createWriteStream(filePath);
            req.pipe(writeStream);
            req.on('end', () => {
                res.writeHead(201);
                res.end('Created');
            });
            break;

        case 'DELETE':
            try {
                await fs.unlink(filePath);
                res.writeHead(200);
                res.end('Deleted');
            } catch {
                res.writeHead(404);
                res.end('Not Found');
            }
            break;

        default:
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
    }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}`);
});
