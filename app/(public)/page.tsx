import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Clock3,
  Factory,
  FileText,
  HardHat,
  MapPin,
  Shield,
  ShieldCheck,
  Truck,
  Users,
  Weight,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceJsonLd } from '@/components/seo/json-ld';
import { SiteContainer } from '@/components/public/site-container';
import { ServiceCard } from '@/components/public/service-card';
import { SiteImage } from '@/components/public/site-image';
import { SectionHeading } from '@/components/public/section-heading';
import { PUBLIC_MEDIA } from '@/lib/content/public-media';
import { featuredFleetCards } from '@/lib/content/home-fleet';
import { SERVICES } from '@/lib/content/services';
import { getCompanySettings } from '@/lib/data/company';
import { getPublicEquipment } from '@/lib/data/equipment';
import { publicStorageUrl } from '@/lib/storage-url';
import { commercialWhatsAppHref } from '@/lib/whatsapp-public';
import { formatBRL } from '@/lib/money';

export const dynamic = 'force-dynamic';

const HOME_SERVICES = [
  'montagens-industriais',
  'fabricacao-estruturas-metalicas',
  'manutencao-industrial',
  'reservatorios-e-tubulacoes',
  'instalacoes-eletricas',
  'transporte-e-movimentacao-de-cargas',
] as const;

export default async function HomePage() {
  const [settings, equipment] = await Promise.all([getCompanySettings(), getPublicEquipment()]);
  const fleet = featuredFleetCards(equipment, (path) => publicStorageUrl('equipment', path));
  const whatsappHref = commercialWhatsAppHref(settings.whatsapp);

  return (
    <>
      <ServiceJsonLd />
      <section className="relative isolate min-h-[620px] overflow-hidden bg-navy text-white md:min-h-[650px]">
        <SiteImage
          src={PUBLIC_MEDIA.hero.src}
          alt={PUBLIC_MEDIA.hero.alt}
          fill
          priority
          sizes="100vw"
          className="scale-105 object-[72%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/35 to-navy/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-navy/15" />
        <SiteContainer className="relative flex min-h-[620px] flex-col justify-center py-16 md:min-h-[650px] md:py-20">
          <div className="max-w-[560px] drop-shadow-[0_8px_24px_rgba(7,27,53,0.35)]">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
              Montagem industrial • Locação de equipamentos
            </p>
            <h1 className="mt-4 text-[38px] leading-[1.12] font-bold text-balance sm:text-[44px] lg:text-[52px]">
              Força, precisão e segurança para grandes operações.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/80">
              Soluções completas em montagem, manutenção, içamento e movimentação de cargas para usinas e
              indústrias de todo o Brasil.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href="/contato">Solicitar orçamento</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                <Link href="/equipamentos">Conhecer equipamentos</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
              <li>Mais de 15 anos de experiência</li>
              <li>Equipe qualificada</li>
              <li>Atendimento industrial</li>
            </ul>
          </div>
          <aside className="mt-10 w-full lg:absolute lg:right-6 lg:bottom-10 lg:mt-0 lg:w-[560px]">
            <ul className="grid grid-cols-1 overflow-hidden rounded-xl border border-white/15 bg-navy/60 sm:grid-cols-3 sm:divide-x sm:divide-white/10">
              {[
                { icon: Weight, title: 'Equipamentos de 25 a 90 toneladas' },
                { icon: ShieldCheck, title: 'Operação com segurança' },
                { icon: MapPin, title: 'Atendimento em todo o Brasil' },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3 px-4 py-4 sm:flex-col sm:gap-2.5 sm:px-5">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold sm:mt-0" strokeWidth={1.75} />
                  <p className="text-sm leading-5 text-white/90">{item.title}</p>
                </li>
              ))}
            </ul>
          </aside>
        </SiteContainer>
      </section>

      <section className="border-b border-border bg-white">
        <SiteContainer className="grid gap-6 py-8 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Factory, title: 'Montagem industrial', text: 'Usinas, estruturas e implantação de planta.' },
            { icon: Truck, title: 'Locação com operador', text: 'Guindastes e muncks na janela da obra.' },
            { icon: FileText, title: 'Plano de rigging', text: 'Içamento planejado antes da mobilização.' },
            { icon: Wrench, title: 'Manutenção especializada', text: 'Paradas, adequações e recuperação estrutural.' },
          ].map((item, index) => (
            <div key={item.title} className={`flex gap-3 ${index > 0 ? 'xl:border-l xl:border-border xl:pl-6' : ''}`}>
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h2 className="text-sm font-semibold text-navy">{item.title}</h2>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </SiteContainer>
      </section>

      <section className="bg-white py-20">
        <SiteContainer className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative">
            <div className="overflow-hidden rounded-[14px]">
              <SiteImage
                src={PUBLIC_MEDIA.about.src}
                alt={PUBLIC_MEDIA.about.alt}
                width={900}
                height={720}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="aspect-[5/4] w-full"
              />
            </div>
            <div className="absolute bottom-5 left-5 rounded-full bg-gold px-5 py-4 text-sm font-semibold text-navy shadow-panel">
              +15 anos de experiência
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Quem somos</p>
            <h2 className="mt-3 text-3xl font-bold text-navy md:text-4xl">Experiência que movimenta a indústria.</h2>
            <p className="mt-5 text-base leading-7 text-muted">
              A Sermontiny é especializada em montagem industrial, fabricação e manutenção de usinas, estruturas
              metálicas, reservatórios, tubulações, locação de guindastes, muncks e equipamentos industriais.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Soluções completas e personalizadas.',
                'Equipe técnica capacitada.',
                'Compromisso com segurança e prazo.',
                'Atendimento industrial.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-navy">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/empresa">
                Conheça a Sermontiny
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </SiteContainer>
      </section>

      <section className="bg-paper py-20">
        <SiteContainer>
          <SectionHeading
            eyebrow="Nossos serviços"
            title="Soluções para operações exigentes."
            action={
              <Button asChild variant="outline">
                <Link href="/servicos">
                  Todos os serviços
                  <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {HOME_SERVICES.map((slug, index) => {
              const service = SERVICES.find((item) => item.slug === slug);
              if (!service) return null;
              return <ServiceCard key={service.slug} service={service} index={index} />;
            })}
          </div>
        </SiteContainer>
      </section>

      <section className="bg-navy-secondary py-20">
        <SiteContainer>
          <SectionHeading
            invert
            eyebrow="Nossa frota"
            title="Equipamentos preparados para cada desafio."
            action={
              <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href="/equipamentos">Conhecer frota completa</Link>
              </Button>
            }
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {fleet.map((item) => (
              <article key={item.name} className="overflow-hidden rounded-[14px] bg-white">
                <SiteImage
                  src={item.image}
                  alt={item.alt}
                  width={640}
                  height={420}
                  sizes="(max-width: 1280px) 50vw, 25vw"
                  className="aspect-[4/3] w-full"
                />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-navy">{item.name}</h3>
                  <p className="mt-1 text-sm font-medium text-gold-bright">{item.capacity}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                  {settings.show_public_prices &&
                    equipment.find((row) => row.name === item.name && row.daily_cents > 0) && (
                      <p className="mt-3 text-sm font-semibold text-navy">
                        Diária {formatBRL(equipment.find((row) => row.name === item.name)?.daily_cents ?? 0)}
                      </p>
                    )}
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href={item.href}>
                      Ver equipamento
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </SiteContainer>
      </section>

      <section className="bg-white py-20">
        <SiteContainer>
          <SectionHeading eyebrow="Nossos diferenciais" title="Por que escolher a Sermontiny." />
          <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Shield, title: 'Segurança operacional', text: 'Içamento, acesso e isolamento tratados antes da execução.' },
              { icon: Users, title: 'Equipe capacitada', text: 'Operadores e montadores preparados para ambiente industrial.' },
              { icon: HardHat, title: 'Planejamento técnico', text: 'Escopo, equipamento e sequência de montagem definidos por escrito.' },
              { icon: Clock3, title: 'Agilidade na execução', text: 'Mobilização alinhada à janela da obra e ao prazo contratado.' },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="h-7 w-7 text-gold" />
                <h3 className="mt-4 text-lg font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      <section className="bg-paper py-20">
        <SiteContainer>
          <SectionHeading
            eyebrow="Nossos projetos"
            title="Projetos que demonstram nossa capacidade."
            action={
              <Button asChild variant="outline">
                <Link href="/projetos">Ver projetos</Link>
              </Button>
            }
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PUBLIC_MEDIA.projects.map((project) => (
              <article key={project.title} className="relative overflow-hidden rounded-[14px]">
                <SiteImage
                  src={project.src}
                  alt={project.alt}
                  width={800}
                  height={520}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="aspect-[5/4] w-full"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-5 text-white">
                  <p className="text-sm font-semibold">{project.title}</p>
                  <p className="mt-1 text-xs text-white/75">{project.segment}</p>
                </div>
              </article>
            ))}
          </div>
        </SiteContainer>
      </section>

      <section className="relative isolate overflow-hidden bg-navy py-20 text-white">
        <SiteImage
          src={PUBLIC_MEDIA.cta.src}
          alt={PUBLIC_MEDIA.cta.alt}
          fill
          sizes="100vw"
          className="opacity-25"
        />
        <div className="absolute inset-0 bg-navy/75" />
        <SiteContainer className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold md:text-4xl">Sua operação precisa de força e planejamento?</h2>
            <p className="mt-3 text-white/75">Fale com nossa equipe e receba uma proposta personalizada.</p>
          </div>
          <Button asChild variant="gold" size="lg">
            <a href={whatsappHref} target={whatsappHref.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              Falar com o comercial
            </a>
          </Button>
        </SiteContainer>
      </section>
    </>
  );
}
