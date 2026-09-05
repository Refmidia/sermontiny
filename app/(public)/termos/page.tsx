import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { SiteContainer } from '@/components/public/site-container';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Condições de uso do site institucional da Sermontiny.',
};

export default function TermsPage() {
  return (
    <article className="bg-white py-16">
      <SiteContainer className="max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">Termos de uso</h1>
        <p className="mt-6 text-sm leading-7 text-muted">
          Este site é mantido pela {SITE.legalName}, CNPJ {SITE.cnpj}, com sede em {SITE.address.full}. O conteúdo
          institucional destina-se à apresentação da empresa e à captação de contatos comerciais.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-navy">Uso das informações</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Textos, imagens e dados técnicos não constituem proposta comercial automática. Orçamentos, prazos e
          responsabilidades só valem após documento emitido pela Sermontiny.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-navy">Contato</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          O formulário e os canais de WhatsApp, telefone e e-mail devem ser usados para solicitações legítimas de
          orçamento ou informações. O tratamento dos dados observa a política de privacidade.
        </p>
      </SiteContainer>
    </article>
  );
}
