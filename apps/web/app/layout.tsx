import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { siteConfigNetworkMap } from '@/lib/siteConfigDomainMap';
import { SITE_DESCRIPTION } from '@/lib/metadata';
import { getSiteMetadata, tenantForNetworkPath } from '@/lib/wordpress';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// AMC+ brand font — self-hosted Endurance Pro (licensed, not on Google Fonts).
// Only Light/Regular/Black upright cuts exist, so `font-bold` (700) has no
// matching upright face; CSS weight-matching resolves it up to Black (900).
// Likewise `font-medium` (500) resolves down to Regular (400). The condensed
// cuts are a separate width family and intentionally left out.
const endurancePro = localFont({
  src: [
    {
      path: './sites/amcplus/EndurancePro/EndurancePro.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-endurance',
  display: 'swap',
});

// Endurance Pro's Bold cut as its own family (registered at normal weight), so
// "bold" text swaps to this family instead of relying on CSS weight-matching.
const enduranceBold = localFont({
  src: [
    {
      path: './sites/amcplus/EndurancePro/Endurance-Bold.woff',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-endurance-bold',
  display: 'swap',
});

// Title comes from the per-brand site config (siteConfigDomainMap), resolved
// from the brand the middleware set on `x-network-path`.
export async function generateMetadata(): Promise<Metadata> {
  const networkPath = (await headers()).get('x-network-path') ?? '';
  const config = siteConfigNetworkMap[networkPath];
  // Prefer the tenant's WordPress Site Title / Tagline (blogname /
  // blogdescription); fall back to the static site config when unset.
  const site = await getSiteMetadata(tenantForNetworkPath(networkPath));
  return {
    title: site.title ?? config?.title ?? 'Reimagined Memory',
    description: site.description ?? SITE_DESCRIPTION,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The subsite being served, set by middleware. <Footer> reads the same
  // header itself to fetch its own menus.
  const networkPath = (await headers()).get('x-network-path');

  return (
    <html
      lang="en"
      // Brand scope for the whole document (set by middleware via
      // `x-network-path`). Hoisted to <html> so the [data-brand] token
      // overrides in colors.css — including the Endurance Pro brand font —
      // cover the header and footer too, not just the page <main>. The
      // unbranded default site has no networkPath, so no attribute is set and
      // the base tokens apply as-is.
      data-brand={networkPath || undefined}
      className={`${inter.variable} ${endurancePro.variable} ${enduranceBold.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-black text-gray-50 antialiased">
        <Header />
        {/* grow pushes the footer to the bottom of the viewport when the page
            content is short, while still letting it flow when content overflows. */}
        <main className="mx-auto w-full max-w-7xl grow">{children}</main>
        {/* Fetches both footer layers itself (see components/Footer.tsx). */}
        <Footer />
      </body>
    </html>
  );
}
