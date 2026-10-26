const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml"
};

http.createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url || "/").split("?")[0]);
    const relative = urlPath === "/" ? "/poster-1-technical.html" : urlPath;
    const filePath = path.join(root, relative);

    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
        response.end(data);
    });
}).listen(3020, () => {
    console.log("Poster server running at http://localhost:3020");
});
