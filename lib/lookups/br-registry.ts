import { formatCep, formatCnpj, formatPhoneBr, onlyDigits } from '@/lib/format';

export type CnpjLookup = {
  document: string;
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export type CepLookup = {
  zip: string;
  street: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export function isLookupError(value: unknown): value is { error: string } {
  return Boolean(value && typeof value === 'object' && 'error' in value && typeof (value as { error: unknown }).error === 'string');
}

function titleCasePt(value: string) {
  return value
    .toLowerCase()
    .replace(/(^|[\s/'-])(\S)/g, (_, sep: string, letter: string) => sep + letter.toUpperCase())
    .replace(/\b(Da|De|Do|Das|Dos|E)\b/g, (word) => word.toLowerCase());
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function getJson(url: string, timeoutMs: number) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

function streetFromCnpj(data: Record<string, unknown>) {
  const type = text(data.descricao_tipo_de_logradouro);
  const street = text(data.logradouro);
  if (!street) return type;
  if (!type) return titleCasePt(street);
  if (street.toLowerCase().startsWith(type.toLowerCase())) return titleCasePt(street);
  return titleCasePt(`${type} ${street}`);
}

function mapBrasilCnpj(data: Record<string, unknown>, digits: string): CnpjLookup | null {
  const legalName = text(data.razao_social) || text(data.nome);
  if (!legalName) return null;
  return {
    document: formatCnpj(digits),
    legalName,
    tradeName: text(data.nome_fantasia) || text(data.fantasia),
    email: text(data.email).toLowerCase(),
    phone: formatPhoneBr(onlyDigits(text(data.ddd_telefone_1) || text(data.ddd_telefone_2) || text(data.telefone))),
    zip: formatCep(text(data.cep)),
    street: streetFromCnpj(data),
    number: text(data.numero),
    complement: titleCasePt(text(data.complemento)),
    district: titleCasePt(text(data.bairro)),
    city: titleCasePt(text(data.municipio)),
    state: text(data.uf).toUpperCase(),
  };
}

function mapReceitaWs(data: Record<string, unknown>, digits: string): CnpjLookup | null {
  if (text(data.status).toUpperCase() === 'ERROR') return null;
  const legalName = text(data.nome);
  if (!legalName) return null;
  return {
    document: formatCnpj(digits),
    legalName,
    tradeName: text(data.fantasia),
    email: text(data.email).toLowerCase(),
    phone: formatPhoneBr(onlyDigits(text(data.telefone))),
    zip: formatCep(text(data.cep)),
    street: titleCasePt(text(data.logradouro)),
    number: text(data.numero),
    complement: titleCasePt(text(data.complemento)),
    district: titleCasePt(text(data.bairro)),
    city: titleCasePt(text(data.municipio)),
    state: text(data.uf).toUpperCase(),
  };
}

export async function fetchCnpj(document: string): Promise<CnpjLookup | { error: string }> {
  const digits = onlyDigits(document);
  if (digits.length !== 14) return { error: 'Informe um CNPJ com 14 dígitos.' };

  const providers = [
    { url: `https://brasilapi.com.br/api/cnpj/v1/${digits}`, map: mapBrasilCnpj },
    { url: `https://minhareceita.org/${digits}`, map: mapBrasilCnpj },
    { url: `https://www.receitaws.com.br/v1/cnpj/${digits}`, map: mapReceitaWs },
  ];

  for (const provider of providers) {
    try {
      const data = await getJson(provider.url, 8000);
      const mapped = data ? provider.map(data, digits) : null;
      if (mapped?.legalName) return mapped;
    } catch {
      // Tenta o próximo provedor.
    }
  }

  return { error: 'Não foi possível consultar o CNPJ agora. Tente de novo em alguns segundos.' };
}

export async function fetchCep(zip: string): Promise<CepLookup | { error: string }> {
  const digits = onlyDigits(zip);
  if (digits.length !== 8) return { error: 'Informe um CEP com 8 dígitos.' };

  const urls = [
    `https://viacep.com.br/ws/${digits}/json/`,
    `https://brasilapi.com.br/api/cep/v2/${digits}`,
    `https://cep.awesomeapi.com.br/json/${digits}`,
  ];

  for (const url of urls) {
    try {
      const data = await getJson(url, 8000);
      if (!data || data.erro || data.error) continue;
      const street = titleCasePt(text(data.street) || text(data.logradouro) || text(data.address));
      const city = titleCasePt(text(data.city) || text(data.localidade));
      const state = text(data.state || data.uf).toUpperCase();
      if (!city && !state && !street) continue;
      return {
        zip: formatCep(text(data.cep) || digits),
        street,
        complement: titleCasePt(text(data.complement) || text(data.complemento)),
        district: titleCasePt(text(data.neighborhood) || text(data.bairro) || text(data.district)),
        city,
        state,
      };
    } catch {
      // Tenta o próximo provedor.
    }
  }

  return { error: 'Não foi possível consultar o CEP agora. Confira o número e tente de novo.' };
}
