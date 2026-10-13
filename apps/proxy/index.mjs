import chalk from 'chalk';
import http from 'node:http';

const NEXT_PORT = process.env.NEXT_PORT ? Number(process.env.NEXT_PORT) : 3000;
const PROXY_PORT = process.env.PROXY_PORT
  ? Number(process.env.PROXY_PORT)
  : 3001;
// The Storybook component workbench (apps/styleguide).
const STORYBOOK_PORT = process.env.STORYBOOK_PORT
  ? Number(process.env.STORYBOOK_PORT)
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

const BASE = '/styleguide';

/*
 * Storybook's dev server only serves from the root: it has no `base` option
 * and ignores Vite's. Its manager uses relative asset URLs, so mounting it at
 * `/styleguide/` works once we strip the prefix. Its Vite preview, however,
 * requests root-absolute URLs that carry no prefix to strip, so they have to
 * be recognised here.
 *
 * These prefixes are all served exclusively by the workbench — Next.js serves
 * its own assets under `/_next/*` — so matching them is unambiguous.
 */
const STORYBOOK_ROOT_PREFIXES = [
  '/@fs/',
  '/@id/',
  '/@vite/',
  '/@react-refresh',
  '/virtual:',
  '/node_modules/',
  '/src/',
  '/.storybook/',
  '/sb-manager/',
  '/sb-addons/',
  '/sb-common-assets/',
  '/sb-preview/',
  '/vite-inject-mocker-entry.js',
  '/storybook-server-channel',
];

const isBasePath = (url = '') =>
  url === BASE || url.startsWith(`${BASE}/`) || url.startsWith(`${BASE}?`);

const isStorybookRootPath = (url = '') =>
  STORYBOOK_ROOT_PREFIXES.some((prefix) => url.startsWith(prefix));

/**
 * Does this request belong to the workbench? Beyond the mount point and the
 * root-absolute paths above, an ES module's imports are resolved against the
 * importing module, so the chain has to be followed through the `Referer`:
 * `/styleguide/iframe.html` pulls in `/@id/…`, which in turn pulls in
 * `/src/<Name>.stories.tsx`. Checking the referer against both sets keeps the
 * whole chain on the workbench instead of leaking into Next after one hop.
 */
function isStorybookRequest(req) {
  const url = req.url ?? '';
  if (isBasePath(url) || isStorybookRootPath(url)) return true;

  const { referer } = req.headers;
  if (!referer) return false;
  try {
    const { pathname } = new URL(referer);
    return isBasePath(pathname) || isStorybookRootPath(pathname);
  } catch {
    return false;
  }
}

/** Drop the `/styleguide` mount point, keeping a root-absolute path. */
function stripBase(url) {
  const rest = url.slice(BASE.length);
  if (rest === '') return '/';
  return rest.startsWith('?') ? `/${rest}` : rest;
}

const server = http.createServer((req, res) => {
  const [hostname] = (req.headers.host ?? '').split(':');
  const mappedHost = domainMap[hostname] ?? 'shudder.com';
  const url = req.url ?? '/';

  // The manager's asset URLs are relative, so the document must be served from
  // a trailing slash or they resolve against `/` and miss the mount entirely.
  if (url === BASE || url.startsWith(`${BASE}?`)) {
    res.writeHead(302, { location: `${BASE}/${url.slice(BASE.length)}` });
    res.end();
    return;
  }

  const onBase = isBasePath(url);
  const toStorybook = isStorybookRequest(req);

  const options = {
    hostname: 'localhost',
    port: toStorybook ? STORYBOOK_PORT : NEXT_PORT,
    path: onBase ? stripBase(url) : url,
    method: req.method,
    // Storybook ignores Host and reads the brand from the browser subdomain, so
    // forward the original host; Next needs the mapped brand host.
    headers: {
      ...req.headers,
      host: toStorybook ? req.headers.host : mappedHost,
    },
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
    chalk.bold(
      `http://<brand>.localhost:${PROXY_PORT}${BASE} → Storybook :${STORYBOOK_PORT}`
    )
  );
  console.log(
    chalk.inverse.bold(
      '-- End Domain Mappings: ------------------------------------------------'
    )
  );
});
