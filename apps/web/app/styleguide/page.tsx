import { Button, Icon } from '@repo/ui';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { siteConfigNetworkMap } from '@/lib/siteConfigDomainMap';

/*
 * Style guide — layout recreated from the supplied reference image.
 *
 * Everything is styled with the semantic tokens declared in app/globals.css
 * (background/*, text/*, action/*, border/*, status/*, the 1-11 type ramp and
 * the 0-14 spacing scale) rather than the reference's raw hexes, so each brand
 * re-exporting this page picks up its own values via [data-brand].
 *
 * Placeholder copy and glyphs throughout — see the notes marked TODO.
 */

function Section({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-6 font-headline text-2 font-bold tracking-[0.12em] text-action-primary uppercase">
        {label}
      </h2>
      {children}
    </section>
  );
}

function Swatch({
  swatchClass,
  name,
  className = '',
}: {
  swatchClass: string;
  name: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`size-11 rounded-full ${swatchClass}`} />
      <span className="font-body text-2 text-text-primary/50">{name}</span>
    </div>
  );
}

/*
 * Semantic color tokens, laid out as a 3-column × 6-row grid of swatches.
 * Rows 1-4 are full triples; row 5 holds the two border colors (third cell
 * left empty) and row 6 the three status colors — so status/error carries
 * col-start-1 to break onto its own row. The faint border keeps
 * white-on-white swatches visible against the light page background.
 */
const COLORS: { swatchClass: string; name: string; className?: string }[] = [
  { swatchClass: 'bg-background-default', name: 'background/default' },
  { swatchClass: 'bg-background-surface', name: 'background/surface' },
  {
    swatchClass: 'bg-background-inverse border border-border-default/25',
    name: 'background/inverse',
  },
  { swatchClass: 'bg-text-primary', name: 'text/primary' },
  {
    swatchClass: 'bg-text-secondary border border-border-default/25',
    name: 'text/secondary',
  },
  { swatchClass: 'bg-text-tertiary', name: 'text/tertiary' },
  { swatchClass: 'bg-action-primary', name: 'action/primary' },
  { swatchClass: 'bg-action-secondary', name: 'action/secondary' },
  { swatchClass: 'bg-action-tertiary', name: 'action/tertiary' },
  {
    swatchClass: 'bg-hover-primary border border-border-default/25',
    name: 'hover/primary',
  },
  { swatchClass: 'bg-hover-secondary', name: 'hover/secondary' },
  { swatchClass: 'bg-hover-tertiary', name: 'hover/tertiary' },
  { swatchClass: 'bg-border-default', name: 'border/default' },
  {
    swatchClass: 'bg-border-hover border border-border-default/25',
    name: 'border/hover',
  },
  {
    swatchClass: 'bg-status-error',
    name: 'status/error',
    className: 'col-start-1',
  },
  { swatchClass: 'bg-status-warning', name: 'status/warning' },
  { swatchClass: 'bg-status-success', name: 'status/success' },
];

/* Every symbol in the shared icon sprite (packages/ui/src/Icon/sprite.svg). */
const ICONS = [
  'accountCircle',
  'add',
  'addCard',
  'addLink',
  'arrowBack',
  'arrowDownward',
  'arrowDropDown',
  'arrowDropUp',
  'arrowForward',
  'arrowLeft',
  'arrowRight',
  'arrowUpward',
  'audioDescription',
  'chat',
  'chatBubble',
  'check',
  'checkSmall',
  'chevronDown',
  'chevronLeft',
  'chevronRight',
  'chevronUp',
  'chromecast',
  'clockLoader10',
  'clockLoader20',
  'clockLoader40',
  'clockLoader60',
  'clockLoader80',
  'clockLoader90',
  'close',
  'closedCaption',
  'closedCaptionDisabled',
  'collections',
  'collectionsBookmark',
  'comment',
  'connectedTV',
  'creditCard',
  'creditCardOff',
  'creditScore',
  'delete',
  'doDisturb',
  'download',
  'downloadDone',
  'downloading',
  'downloadingPause',
  'downloadingStop',
  'email',
  'error',
  'explore',
  'facebook',
  'fastForward',
  'fastRewind',
  'featuredVideo',
  'fiberDVR',
  'filterList',
  'forward5',
  'forward10',
  'forward30',
  'fullscreen',
  'gridView',
  'group',
  'groupAdd',
  'groupOff',
  'hd',
  'hdrOff',
  'hdrOn',
  'headphones',
  'help',
  'home',
  'info',
  'instagram',
  'iosShare',
  'keyboardDoubleArrowDown',
  'keyboardDoubleArrowLeft',
  'keyboardDoubleArrowRight',
  'keyboardDoubleArrowUp',
  'launch',
  'list',
  'live',
  'loading',
  'locationOff',
  'locationOn',
  'login',
  'logout',
  'moreHorizontal',
  'moreVertical',
  'movies',
  'myStuff',
  'pauseCircle',
  'payment',
  'payments',
  'people',
  'playArrow',
  'playCircle',
  'playDisabled',
  'playPause',
  'reddit',
  'refresh',
  'remove',
  'repeat',
  'repeatOne',
  'replay10',
  'replay15',
  'replay30',
  'reportProblem',
  'resume',
  'search',
  'series',
  'selectToSpeak',
  'settings',
  'settingsAlert',
  'share',
  'skipNext',
  'skipPrevious',
  'sort',
  'starHalf',
  'starOutline',
  'stop',
  'subscriptions',
  'subtitles',
  'subtitlesOff',
  'thumbDown',
  'thumbUp',
  'tiktok',
  'tv',
  'tvOff',
  'twitter',
  'unfoldLess',
  'unfoldMore',
  'videoSettings',
  'visibility',
  'visibilityOff',
  'volumeDown',
  'volumeMute',
  'volumeOff',
  'volumeUp',
  'watchLater',
  'youtube',
  'x',
];

export default async function StyleguidePage() {
  /* Title matches the subsite — middleware sets x-network-path per brand. */
  const networkPath = (await headers()).get('x-network-path') ?? '';
  const brand = siteConfigNetworkMap[networkPath]?.title ?? 'Brand';
  /* AMC+ uses Oswald (Endurance Pro substitute); every other brand uses Inter. */
  const fontFamily = networkPath === 'amcplus' ? 'Oswald' : 'Inter';

  return (
    /* <div>, not <main>: the per-brand layouts already wrap this in <main>. */
    <div className="min-h-screen bg-background-inverse pb-0 font-body text-text-primary">
      <h1 className="py-9 text-center font-headline text-7 text-text-primary">
        {brand} Style Guide
      </h1>

      {/* ---------- Colors / Typeface (left) · Icons (right) ---------- */}
      <div className="mx-auto grid max-w-6xl gap-x-12 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Left column: colors + typography */}
        <div className="flex flex-col gap-13">
          <Section label="Colors">
            {/* 3 columns × 6 rows — one swatch per semantic token. */}
            <div className="grid max-w-md grid-cols-3 gap-x-9 gap-y-7">
              {COLORS.map(({ swatchClass, name, className }) => (
                <Swatch
                  key={name}
                  swatchClass={swatchClass}
                  name={name}
                  className={className}
                />
              ))}
            </div>
          </Section>

          <Section label="Typeface">
            <div className="grid grid-cols-1 gap-9 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
              <div>
                {/* TODO: no type token above 48px (text-11); 96px is ad-hoc. */}
                <p className="font-headline text-[96px] leading-none font-bold text-text-primary">
                  Aa
                </p>
                <dl className="mt-6 space-y-2 font-body text-2">
                  <div className="flex gap-4">
                    <dt className="text-text-primary/40">Font Family:</dt>
                    <dd className="font-bold">{fontFamily}</dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="text-text-primary/40">Font Weight:</dt>
                    <dd className="space-y-1">
                      <p className="font-light">Light</p>
                      <p className="font-regular">Regular</p>
                      <p className="font-medium">Medium</p>
                      <p className="font-bold">Bold</p>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                {/* <p className="font-headline text-(length:--text-11) leading-(--text-11--line-height) font-bold">
                  H1 Heading
                </p>
                <p className="font-headline text-(length:--text-10) leading-(--text-10--line-height) font-light">
                  H2 Heading
                </p>
                <p className="font-headline text-(length:--text-9) leading-(--text-9--line-height) font-light">
                  H3 Heading
                </p>
                <p className="font-headline text-(length:--text-8) leading-(--text-8--line-height) font-medium">
                  H4 Heading
                </p>
                <p className="font-headline text-(length:--text-7) leading-(--text-7--line-height) font-medium">
                  H5 Heading
                </p>
                <p className="font-headline text-(length:--text-6) leading-(--text-6--line-height) font-medium">
                  H6 Heading
                </p> */}

                <p className="max-w-[10ch] font-body text-11 text-text-primary">
                  Text Size 11
                </p>
                <p className="max-w-[46ch] font-body text-10 text-text-primary">
                  Text Size 10
                </p>
                <p className="max-w-[46ch] font-body text-9 text-text-primary">
                  Text Size 9
                </p>
                <p className="max-w-[46ch] font-body text-8 text-text-primary">
                  Text Size 8
                </p>
                <p className="max-w-[46ch] font-body text-7 text-text-primary">
                  Text Size 7
                </p>
                <p className="max-w-[46ch] font-body text-6 text-text-primary">
                  Text Size 6
                </p>
                <p className="max-w-[46ch] font-body text-5 text-text-primary">
                  Text Size 5
                </p>
                <p className="max-w-[46ch] font-body text-4 text-text-primary">
                  Text Size 4
                </p>
                <p className="max-w-[46ch] font-body text-3 text-text-primary">
                  Text Size 3
                </p>
                <p className="max-w-[46ch] font-body text-2 text-text-primary">
                  Text Size 2
                </p>
                <p className="max-w-[46ch] font-body text-1 text-text-primary">
                  Text Size 1
                </p>
              </div>
            </div>
          </Section>

          <Section label="Buttons">
            {/* One of each Figma Button type; hover to see the state change. */}
            <div className="flex flex-wrap items-center gap-6">
              <Button variant="primary">Start Free Trial</Button>
              <Button
                variant="secondary"
                icon={<Icon name="playArrow" size="md" />}
              >
                Watch Free Episode
              </Button>
              <Button variant="tertiary">Sign In</Button>
            </div>
          </Section>
        </div>

        {/* Right column: icons */}
        <div>
          <Section label="Icons">
            {/* 4 columns, one cell per icon in the shared sprite. */}
            <div className="grid grid-cols-4">
              {ICONS.map((name) => (
                <div
                  key={name}
                  className="flex aspect-square flex-col items-center justify-center gap-2 border border-border-default/20 p-2 transition-colors hover:border-action-primary"
                >
                  <Icon name={name} size="lg" className="text-text-primary" />
                  <span className="w-full truncate text-center font-body text-1 text-text-primary/45">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <footer className="bg-background-default py-7 text-center font-body text-2 text-text-tertiary">
        Copyright © 2026 Placeholder Inc.
      </footer>
    </div>
  );
}
