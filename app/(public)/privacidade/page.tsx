import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: 'Como a Sermontiny trata dados pessoais em conformidade com a LGPD.',
};

export default function PrivacyPage() {
  return (
    <article className="site-container max-w-3xl py-16">
      <h1 className="text-4xl font-bold text-navy">Política de privacidade</h1>
      <p className="mt-6 text-sm leading-7 text-muted">
        A {SITE.legalName}, inscrita no CNPJ {SITE.cnpj}, com sede em {SITE.address.full}, trata dados
        pessoais para atendimento comercial, emissão de orçamentos, contratos e cumprimento de obrigações
        legais.
      </p>
      <h2 className="mt-8 text-2xl font-semibold text-navy">Dados coletados</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Nome, empresa, e-mail, telefone, WhatsApp, assunto, equipamento de interesse e mensagem enviada pelo
        formulário de contato. No painel, também são tratados dados cadastrais de clientes, unidades e
        responsáveis.
      </p>
      <h2 className="mt-8 text-2xl font-semibold text-navy">Finalidade e base legal</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Os dados do site são usados para retorno comercial mediante consentimento. Os dados de clientes e
        contratos são tratados para execução de procedimentos preliminares e de contrato, além de obrigações
        legais e fiscais.
      </p>
      <h2 className="mt-8 text-2xl font-semibold text-navy">Compartilhamento</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Utilizamos operadores de hospedagem, autenticação e armazenamento (incluindo Supabase e, quando
        configurado, a API oficial do WhatsApp). Não vendemos dados pessoais.
      </p>
      <h2 className="mt-8 text-2xl font-semibold text-navy">Direitos do titular</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        O titular pode solicitar acesso, correção, anonimização, portabilidade ou eliminação, quando cabível,
        pelo e-mail {SITE.email}.
      </p>
      <h2 className="mt-8 text-2xl font-semibold text-navy">Retenção</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Contatos comerciais são mantidos enquanto houver relacionamento ou obrigação legal. Documentos
        fiscais e contratuais observam os prazos legais aplicáveis.
      </p>
    </article>
  );
}
