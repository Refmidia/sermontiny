export function commercialWhatsAppHref(whatsapp?: string | null, message?: string) {
  const digits = (whatsapp ?? '').replace(/\D/g, '');
  const text = encodeURIComponent(
    message ??
      'Olá, gostaria de receber uma proposta personalizada da Sermontiny Montagens Industriais e Locações.',
  );
  if (!digits) return '/contato';
  return `https://wa.me/${digits}?text=${text}`;
}
