import type { InputHTMLAttributes, ReactNode } from 'react';

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

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-1 shrink-0"
    >
      <path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" />
    </svg>
  );
}

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

function Swatch({ swatchClass, name }: { swatchClass: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`size-11 rounded-full ${swatchClass}`} />
      <span className="font-body text-2 text-text-primary/50">{name}</span>
    </div>
  );
}

/** Outlined text input. `tone` switches the resting border colour. */
function Field({
  tone = 'muted',
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  tone?: 'muted' | 'accent' | 'error' | 'plain';
}) {
  const tones = {
    muted: 'border-action-primary/30 focus:border-action-primary',
    accent: 'border-action-primary',
    error: 'border-status-error',
    plain: 'border-border-default/20 focus:border-action-primary',
  };
  return (
    <input
      className={`w-full border bg-transparent px-4 py-3 font-body text-3 text-text-primary transition-colors placeholder:text-text-primary/35 focus:outline-none ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

/* Social glyphs are text placeholders — swap for real brand marks later. */
const SOCIAL = [
  { glyph: 'f', name: 'Facebook' },
  { glyph: '▶', name: 'Youtube' },
  { glyph: '◉', name: 'Instagram' },
  { glyph: 'G+', name: 'Google' },
  { glyph: 'P', name: 'Pinterest' },
  { glyph: 'in', name: 'Linkedin' },
];

export default function StyleguidePage() {
  return (
    /* <div>, not <main>: the per-brand layouts already wrap this in <main>. */
    <div className="min-h-screen bg-background-inverse pb-0 font-body text-text-primary">
      <h1 className="py-9 text-center font-headline text-7 text-text-primary">
        Brand Style Guide
      </h1>

      {/* ---------- Header / nav ---------- */}
      <div className="mx-auto max-w-6xl px-6">
        <header className="flex flex-wrap items-center justify-between gap-6 border border-border-default/20 px-6 py-5">
          <span className="font-headline text-6 font-bold tracking-[0.2em] text-text-primary">
            LOGO
          </span>
          <nav className="flex flex-wrap items-center gap-7">
            {['About us', 'Services', 'Portfolio', 'Blog'].map((item) => (
              <a
                key={item}
                href="#"
                className="font-body text-2 tracking-[0.08em] text-text-primary/60 uppercase transition-colors hover:text-action-primary"
              >
                {item}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="inline-flex items-center gap-3 border border-border-default/30 px-5 py-3 font-cta text-3 text-text-primary transition-colors hover:border-action-primary hover:text-action-primary"
          >
            Contact Us
            <ArrowRight />
          </button>
        </header>
      </div>

      {/* ---------- Colors / Typeface + Buttons ---------- */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-12 gap-y-13 px-6 py-13 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-13">
          <Section label="Colors">
            <div className="flex flex-wrap gap-x-9 gap-y-7">
              <Swatch
                swatchClass="bg-background-default"
                name="background/default"
              />
              <Swatch
                swatchClass="bg-background-surface"
                name="background/surface"
              />
              <Swatch swatchClass="bg-border-default" name="border/default" />
            </div>
            <div className="mt-7 flex flex-wrap gap-x-9 gap-y-7">
              <Swatch swatchClass="bg-action-primary" name="action/primary" />
              <Swatch
                swatchClass="bg-action-primary/60"
                name="action/primary 60%"
              />
              <Swatch
                swatchClass="bg-action-primary/25"
                name="action/primary 25%"
              />
              <Swatch
                swatchClass="bg-background-inverse border border-border-default/25"
                name="background/inverse"
              />
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
                    <dd className="font-bold">Inter</dd>
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
                <p className="font-headline text-11 font-bold">H1 Heading</p>
                <p className="font-headline text-9 font-light">H2 Heading</p>
                <p className="font-headline text-7 font-medium">H3 Heading</p>
                <p className="font-headline text-6 font-medium">H4 Heading</p>
                <p className="font-headline text-4 font-medium">H5 Heading</p>
                <p className="font-headline text-3 font-medium">H6 Heading</p>
                <p className="max-w-[46ch] pt-5 font-body text-4 text-text-primary">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud
                </p>
                <p className="max-w-[46ch] font-body text-3 text-text-primary/35">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* ---------- Buttons column ---------- */}
        <div className="flex flex-col gap-13">
          <Section label="Buttons">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  className="inline-flex items-center gap-3 border border-border-default/30 px-5 py-3 font-cta text-3"
                >
                  Contact Us
                  <ArrowRight />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 font-cta text-3"
                >
                  Subscribe
                  <ArrowRight />
                </button>
              </div>
              <button
                type="button"
                className="w-[75%] bg-background-surface px-6 py-3 font-cta text-2 tracking-[0.08em] text-text-secondary uppercase"
              >
                Subscribe
              </button>
              <button
                type="button"
                className="w-full bg-action-primary px-6 py-4 font-cta text-2 tracking-[0.08em] text-text-primary uppercase"
              >
                Subscribe
              </button>
              <button
                type="button"
                className="w-full bg-background-surface px-6 py-4 font-cta text-2 tracking-[0.08em] text-text-secondary uppercase"
              >
                Subscribe
              </button>
            </div>
          </Section>

          <Section label="Hover">
            <div className="space-y-5">
              <button
                type="button"
                className="inline-flex items-center gap-3 font-cta text-3 text-action-primary"
              >
                Subscribe
                <ArrowRight />
              </button>
              <button
                type="button"
                className="w-[75%] border border-border-default/25 px-6 py-3 font-cta text-2 tracking-[0.08em] uppercase"
              >
                Subscribe
              </button>
              <button
                type="button"
                className="w-full border border-action-primary px-6 py-4 font-cta text-2 tracking-[0.08em] text-action-primary uppercase"
              >
                Subscribe
              </button>
              <button
                type="button"
                className="w-full border border-border-default/25 px-6 py-4 font-cta text-2 tracking-[0.08em] uppercase"
              >
                Subscribe
              </button>
            </div>
          </Section>

          <Section label="Buttons social media">
            <div className="grid max-w-[240px] grid-cols-3">
              {SOCIAL.map(({ glyph, name }) => (
                <button
                  key={name}
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center gap-2 border border-border-default/20 transition-colors hover:border-action-primary"
                >
                  <span
                    className="font-headline text-6 font-bold"
                    aria-hidden="true"
                  >
                    {glyph}
                  </span>
                  <span className="font-body text-1 text-text-primary/45">
                    {name}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-4">
              {['f', 't', 'in'].map((glyph) => (
                <button
                  key={glyph}
                  type="button"
                  className="flex size-9 items-center justify-center bg-action-primary font-headline text-5 font-bold text-text-primary"
                >
                  <span aria-hidden="true">{glyph}</span>
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ---------- Forms ---------- */}
      <div className="mx-auto max-w-6xl px-6 pb-13">
        <Section label="Forms">
          <div className="grid grid-cols-1 gap-x-12 gap-y-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
            {/* Dark card */}
            <form className="flex flex-col gap-4 self-start bg-background-default p-7">
              <Field tone="accent" placeholder="Your Full Name" />
              <Field tone="accent" placeholder="Your E-mail" />
              <Field tone="accent" placeholder="Website URL" />
              <Field tone="accent" placeholder="Your Request" />
              <div className="pt-5">
                <Field
                  tone="error"
                  defaultValue="example@gmail.com"
                  aria-invalid="true"
                  aria-describedby="dark-email-error"
                />
                <p
                  id="dark-email-error"
                  className="mt-2 font-body text-1 text-status-error"
                >
                  Please fill in your email
                </p>
              </div>
              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-3 self-start font-cta text-3 text-text-secondary"
              >
                Send
                <ArrowRight />
              </button>
            </form>

            {/* Light column */}
            <form className="flex flex-col gap-4 self-start">
              <Field placeholder="Enter Your Website Address" />
              <Field placeholder="Email" />
              <Field placeholder="Name" />
              <div className="pt-5">
                <Field
                  tone="error"
                  placeholder="example@gmail.com"
                  aria-invalid="true"
                  aria-describedby="light-email-error"
                />
                <p
                  id="light-email-error"
                  className="mt-2 font-body text-1 text-status-error"
                >
                  Please fill in your email
                </p>
              </div>
              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-3 self-start font-cta text-3"
              >
                Get pricing
                <ArrowRight />
              </button>
            </form>

            {/* Narrow column */}
            <form className="flex flex-col gap-4 self-start">
              <Field tone="plain" placeholder="Email" />
              <Field tone="plain" placeholder="Name" />
              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-3 self-start font-cta text-3"
              >
                Subscribe
                <ArrowRight />
              </button>
            </form>
          </div>

          {/* Inline subscribe rows */}
          <div className="mt-9 grid grid-cols-1 gap-x-12 gap-y-9 lg:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)]">
            <div className="space-y-7">
              {[0, 1].map((row) => (
                <form
                  key={row}
                  className="grid grid-cols-1 border border-border-default/15 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]"
                >
                  <Field
                    tone="plain"
                    placeholder="Your Name"
                    className="border-0"
                  />
                  <Field
                    tone="plain"
                    placeholder="Your Email"
                    className="border-0"
                  />
                  <button
                    type="submit"
                    className="bg-action-primary px-6 py-4 font-cta text-2 tracking-[0.08em] text-text-primary uppercase"
                  >
                    Subscribe
                  </button>
                </form>
              ))}
            </div>

            <form className="flex flex-col gap-4">
              <Field tone="plain" placeholder="Email" />
              <Field tone="plain" placeholder="Name" />
              <button
                type="submit"
                className="bg-background-surface px-6 py-4 font-cta text-2 tracking-[0.08em] text-text-secondary uppercase"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Accent panel */}
          <div className="mt-9 space-y-6 bg-action-primary p-9">
            <form className="grid grid-cols-1 bg-background-inverse sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)]">
              <Field
                tone="plain"
                placeholder="Your Name"
                className="border-0"
              />
              <Field
                tone="plain"
                placeholder="Your Email"
                className="border-0"
              />
              <button
                type="submit"
                className="bg-background-surface px-6 py-4 font-cta text-2 tracking-[0.08em] text-text-secondary uppercase"
              >
                Submit
              </button>
            </form>
            <form className="grid grid-cols-1 bg-background-inverse sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)]">
              <Field
                tone="plain"
                placeholder="Your Name"
                className="border-0"
              />
              <Field
                tone="plain"
                placeholder="Your Email"
                className="border-0"
              />
              <Field
                tone="plain"
                placeholder="Your Website"
                className="border-0"
              />
              <button
                type="submit"
                className="bg-background-surface px-6 py-4 font-cta text-2 tracking-[0.08em] text-text-secondary uppercase"
              >
                Get a proposal
              </button>
            </form>
          </div>
        </Section>
      </div>

      {/* ---------- Footer ---------- */}
      <footer className="bg-background-default py-7 text-center font-body text-2 text-text-tertiary">
        Copyright © 2026 Placeholder Inc.
      </footer>
    </div>
  );
}
