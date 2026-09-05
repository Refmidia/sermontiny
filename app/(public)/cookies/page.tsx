import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Informações sobre o uso de cookies no site da Sermontiny.',
};

export default function CookiesPage() {
  return (
    <article className="site-container max-w-3xl py-16">
      <h1 className="text-4xl font-bold text-navy">Política de cookies</h1>
      <p className="mt-6 text-sm leading-7 text-muted">
        Utilizamos cookies essenciais para segurança da sessão administrativa e preferência de consentimento.
        Cookies de medição só são considerados quando o visitante aceita o aviso exibido no rodapé.
      </p>
      <h2 className="mt-8 text-2xl font-semibold text-navy">Essenciais</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Necessários para autenticar o painel, proteger rotas administrativas e lembrar a escolha do aviso de
        cookies.
      </p>
      <h2 className="mt-8 text-2xl font-semibold text-navy">Como gerenciar</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        O visitante pode aceitar todos os cookies ou manter apenas os essenciais. A escolha fica armazenada no
        navegador e pode ser apagada a qualquer momento nas configurações do dispositivo.
      </p>
    </article>
  );
}
