import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3003;

const ASSETS = {
  '/fighter.jpg': {
    path: fileURLToPath(new URL('./public/fighter.jpg', import.meta.url)),
    type: 'image/jpeg',
  },
  '/diagram.png': {
    path: fileURLToPath(new URL('./public/diagram.png', import.meta.url)),
    type: 'image/png',
  },
};

const PAGE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>The Brooklyn Pugilist</title>
    <style>
      html, body { margin: 0; height: 100%; }
      html {
        scroll-snap-type: y mandatory;
        overflow-y: scroll;
      }
      .pane {
        width: 100vw;
        height: 100vh;
        scroll-snap-align: start;
      }
      .pane--fighter {
        background: #000 center / cover no-repeat url("/fighter.jpg");
      }
      .pane--center {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
      }
      .pane--center img { max-width: 100%; max-height: 100%; }
    </style>
  </head>
  <body>
    <section class="pane pane--fighter"></section>
    <section class="pane pane--center">
      <img src="/diagram.png" alt="Diagram" />
    </section>
  </body>
</html>`;

const server = http.createServer(async (req, res) => {
  const asset = ASSETS[req.url];
  if (asset) {
    try {
      const data = await readFile(asset.path);
      res.writeHead(200, { 'content-type': asset.type });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
