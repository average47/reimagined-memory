import chalk from 'chalk';
import http from 'node:http';

const NEXT_PORT = process.env.NEXT_PORT ? Number(process.env.NEXT_PORT) : 3000;
const PROXY_PORT = process.env.PROXY_PORT
  ? Number(process.env.PROXY_PORT)
  : 3001;
// The Storybook component workbench (apps/storybook), mounted at /styleguide.
const STORYBOOK_PORT = process.env.STORYBOOK_PORT
  ? Number(process.env.STORYBOOK_PORT)
  : 6006;

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

/*
 * Storybook mounts at /styleguide. Its manager uses relative asset paths (so
 * they ride the /styleguide prefix), but the Vite-built preview emits some
 * absolute module URLs (/@id, /@vite, /@fs, /sb-*, …). We route both:
 *   - /styleguide/*  → Storybook with the prefix stripped
 *   - the preview's absolute prefixes → Storybook as-is
 * Brand theming is a Storybook toolbar global, so Storybook doesn't need the
 * brand host — we send it `localhost` to satisfy Vite's host check.
 */
const SB_ROOT_PREFIXES = [
  '/@',
  '/sb-',
  '/node_modules/',
  '/index.json',
  '/iframe.html',
  '/virtual:',
  '/storybook-',
];

function storybookRoute(url = '') {
  if (url === '/styleguide') return { redirect: '/styleguide/' };
  if (url.startsWith('/styleguide')) {
    let rest = url.slice('/styleguide'.length); // leading '/' or '?'
    if (rest.startsWith('?')) rest = `/${rest}`;
    return { path: rest || '/' };
  }
  if (SB_ROOT_PREFIXES.some((p) => url.startsWith(p))) return { path: url };
  return null;
}

const server = http.createServer((req, res) => {
  const [hostname] = (req.headers.host ?? '').split(':');
  const mappedHost = domainMap[hostname] ?? 'shudder.com';
  const sb = storybookRoute(req.url);

  if (sb?.redirect) {
    res.writeHead(308, { Location: sb.redirect });
    res.end();
    return;
  }

  const options = {
    hostname: 'localhost',
    port: sb ? STORYBOOK_PORT : NEXT_PORT,
    path: sb ? sb.path : req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: sb ? `localhost:${STORYBOOK_PORT}` : mappedHost,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(chalk.red(`[proxy] ${req.method} ${req.url} → ${err.message}`));
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
    chalk.bold(
      `http://<brand>.localhost:${PROXY_PORT}/styleguide → Storybook :${STORYBOOK_PORT}`
    )
  );
  console.log(
    chalk.inverse.bold(
      '-- End Domain Mappings: ------------------------------------------------'
    )
  );
});
