import { SiteContainer } from '@/components/public/site-container';

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="bg-navy py-14 text-white md:py-16">
      <SiteContainer>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-bold md:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">{description}</p>}
      </SiteContainer>
    </section>
  );
}
