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

function titleCasePt(value: string) {
  return value
    .toLowerCase()
    .replace(/(^|[\s/'-])(\S)/g, (_, sep: string, letter: string) => sep + letter.toUpperCase())
    .replace(/\b(Da|De|Do|Das|Dos|E)\b/g, (word) => word.toLowerCase());
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function streetFromCnpj(data: Record<string, unknown>) {
  const type = text(data.descricao_tipo_de_logradouro);
  const street = text(data.logradouro);
  if (!street) return type;
  if (!type) return titleCasePt(street);
  if (street.toLowerCase().startsWith(type.toLowerCase())) return titleCasePt(street);
  return titleCasePt(`${type} ${street}`);
}

export async function fetchCnpj(document: string): Promise<CnpjLookup | { error: string }> {
  const digits = onlyDigits(document);
  if (digits.length !== 14) return { error: 'Informe um CNPJ com 14 dígitos.' };

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) return { error: 'CNPJ não encontrado.' };
  if (!response.ok) return { error: 'Não foi possível consultar o CNPJ agora.' };

  const data = (await response.json()) as Record<string, unknown>;
  const legalName = text(data.razao_social);
  if (!legalName) return { error: 'CNPJ sem razão social disponível.' };

  return {
    document: formatCnpj(digits),
    legalName,
    tradeName: text(data.nome_fantasia),
    email: text(data.email).toLowerCase(),
    phone: formatPhoneBr(onlyDigits(text(data.ddd_telefone_1) || text(data.ddd_telefone_2))),
    zip: formatCep(text(data.cep)),
    street: streetFromCnpj(data),
    number: text(data.numero),
    complement: titleCasePt(text(data.complemento)),
    district: titleCasePt(text(data.bairro)),
    city: titleCasePt(text(data.municipio)),
    state: text(data.uf).toUpperCase(),
  };
}

export async function fetchCep(zip: string): Promise<CepLookup | { error: string }> {
  const digits = onlyDigits(zip);
  if (digits.length !== 8) return { error: 'Informe um CEP com 8 dígitos.' };

  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (response.status === 404) return { error: 'CEP não encontrado.' };
  if (!response.ok) return { error: 'Não foi possível consultar o CEP agora.' };

  const data = (await response.json()) as Record<string, unknown>;
  if (data.erro) return { error: 'CEP não encontrado.' };

  return {
    zip: formatCep(text(data.cep) || digits),
    street: titleCasePt(text(data.street) || text(data.logradouro)),
    complement: titleCasePt(text(data.complement)),
    district: titleCasePt(text(data.neighborhood) || text(data.bairro)),
    city: titleCasePt(text(data.city) || text(data.localidade)),
    state: text(data.state || data.uf).toUpperCase(),
  };
}
