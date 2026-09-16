import { Hero } from '@repo/ui';

export default function MarketingPage() {
  return (
    <Hero
      backgroundSrc="/marketing/hero-bg.png"
      logoSrc="/marketing/amc-plus-logo.svg"
      logoAlt="AMC+"
      title="Exceptional Stories. Unforgettable Drama."
      description="Award-winning originals, hit TV series, classic films and iconic franchises, all on AMC+."
      priceText={
        <>
          Plans start at <span className="font-semibold">$6.99/month</span>
        </>
      }
      ctaLabel="Start Free Trial"
      ctaHref="#"
    />
  );
}
