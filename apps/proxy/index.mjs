import chalk from 'chalk';
import http from 'node:http';

const NEXT_PORT = process.env.NEXT_PORT ? Number(process.env.NEXT_PORT) : 3000;
const PROXY_PORT = process.env.PROXY_PORT
  ? Number(process.env.PROXY_PORT)
  : 3001;
// The Ladle component workbench (apps/ladle), mounted at base `/styleguide/`.
const LADLE_PORT = process.env.LADLE_PORT
  ? Number(process.env.LADLE_PORT)
  : 61000;

const colors = ['green', 'yellow', 'blue', 'magenta', 'cyan', 'gray', 'grey'];

// Maps *.localhost subdomains to the real hostnames the Next.js middleware
// uses for site resolution via siteConfigDomainMap.
const domainMap = {
  'acorn.localhost': 'acorn.tv',
  'amcplus.localhost': 'amcplus.com',
  'shudder.localhost': 'shudder.com',
  'sundancenow.localhost': 'sundancenow.com',
  'wetv.localhost': 'wetv.com',
};

// `/styleguide` (and its assets) is served by the Ladle app, which carries the
// brand itself via the subdomain. Everything else goes to Next.js, host-mapped
// for brand resolution by its middleware.
const isLadlePath = (url = '') =>
  url === '/styleguide' || url.startsWith('/styleguide/') || url.startsWith('/styleguide?');

const server = http.createServer((req, res) => {
  const [hostname] = (req.headers.host ?? '').split(':');
  const mappedHost = domainMap[hostname] ?? 'shudder.com';
  const toLadle = isLadlePath(req.url);

  const options = {
    hostname: 'localhost',
    port: toLadle ? LADLE_PORT : NEXT_PORT,
    path: req.url,
    method: req.method,
    // Ladle ignores Host and reads the brand from the browser subdomain, so
    // forward the original host; Next needs the mapped brand host.
    headers: { ...req.headers, host: toLadle ? req.headers.host : mappedHost },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(
      chalk.red(`[proxy] ${req.method} ${req.url} → ${err.message}`)
    );
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(
    chalk.inverse.bold(
      '-- Domain Mappings: ----------------------------------------------------'
    )
  );
  const domainEntries = Object.entries(domainMap);
  for (const [index, [local, real]] of domainEntries.entries()) {
    console.log(
      chalk[colors[index % colors.length]].bold(
        `http://${local}:${PROXY_PORT} → ${real} → Next.js :${NEXT_PORT}`
      )
    );
  }
  console.log(
    chalk.bold(`http://<brand>.localhost:${PROXY_PORT}/styleguide → Ladle :${LADLE_PORT}`)
  );
  console.log(
    chalk.inverse.bold(
      '-- End Domain Mappings: ------------------------------------------------'
    )
  );
});
