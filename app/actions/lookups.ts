'use server';

import { fetchCep, fetchCnpj } from '@/lib/lookups/br-registry';

export async function lookupCnpjAction(document: string) {
  try {
    return await fetchCnpj(document);
  } catch {
    return { error: 'Não foi possível consultar o CNPJ agora.' };
  }
}

export async function lookupCepAction(zip: string) {
  try {
    return await fetchCep(zip);
  } catch {
    return { error: 'Não foi possível consultar o CEP agora.' };
  }
}
