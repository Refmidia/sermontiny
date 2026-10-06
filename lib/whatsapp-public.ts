export function commercialWhatsAppHref(whatsapp?: string | null, message?: string) {
  const raw = (whatsapp ?? '').replace(/\D/g, '');
  const digits = raw.length === 10 || raw.length === 11 ? `55${raw}` : raw;
  const text = encodeURIComponent(
    message ??
      'Olá, gostaria de receber uma proposta personalizada da Sermontiny Montagens Industriais e Locações.',
  );
  if (!digits) return '/contato';
  return `https://wa.me/${digits}?text=${text}`;
}
