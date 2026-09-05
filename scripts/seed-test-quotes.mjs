import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const TEENS = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const HUNDREDS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function chunk(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` e ${UNITS[n % 10]}` : '');
  return HUNDREDS[Math.floor(n / 100)] + (n % 100 ? ` e ${chunk(n % 100)}` : '');
}

function integerToWords(n) {
  if (n === 0) return 'zero';
  const million = Math.floor(n / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts = [];
  if (million) parts.push(million === 1 ? 'um milhão' : `${chunk(million)} milhões`);
  if (thousand) parts.push(thousand === 1 ? 'mil' : `${chunk(thousand)} mil`);
  if (rest) parts.push(chunk(rest));
  return parts.join(' e ');
}

function centsToExtenso(cents) {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  if (reais === 0 && centavos === 0) return 'zero reais';
  const parts = [];
  if (reais > 0) {
    const words = integerToWords(reais);
    const de = reais % 1_000_000 === 0 && reais >= 1_000_000 ? ' de ' : ' ';
    parts.push(`${words}${de}${reais === 1 ? 'real' : 'reais'}`);
  }
  if (centavos > 0) {
    parts.push(`${integerToWords(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  }
  return parts.join(' e ');
}

const CLIENTS = [
  {
    legal_name: 'Atlas Ferro e Aço Ltda',
    trade_name: 'Atlas Aço',
    document: '54829167000104',
    city: 'Araçatuba',
    state: 'SP',
    street: 'Avenida Industrial',
    number: '1200',
    district: 'Distrito Industrial',
    zip: '16078-000',
    email: 'compras@atlasaco-teste.com',
    phone: '(18) 3344-1900',
  },
  {
    legal_name: 'Norte Sul Usinas Ltda',
    trade_name: 'Norte Sul',
    document: '39184725000188',
    city: 'Presidente Prudente',
    state: 'SP',
    street: 'Rua das Indústrias',
    number: '450',
    district: 'Parque Industrial',
    zip: '19053-340',
    email: 'obras@nortesul-teste.com',
    phone: '(18) 3222-4488',
  },
  {
    legal_name: 'Vale Verde Energia Ltda',
    trade_name: 'Vale Verde',
    document: '27615983000161',
    city: 'Marília',
    state: 'SP',
    street: 'Rodovia Comandante João Ribeiro de Barros',
    number: 'km 12',
    district: 'Zona Rural',
    zip: '17500-000',
    email: 'engenharia@valeverde-teste.com',
    phone: '(14) 3413-7700',
  },
  {
    legal_name: 'Horizonte Metalúrgica Ltda',
    trade_name: 'Horizonte',
    document: '81473652000139',
    city: 'Bauru',
    state: 'SP',
    street: 'Rua Primeiro de Agosto',
    number: '880',
    district: 'Vila Industrial',
    zip: '17056-010',
    email: 'manutencao@horizonte-teste.com',
    phone: '(14) 3234-9011',
  },
  {
    legal_name: 'Paraná Processo Industrial Ltda',
    trade_name: 'PPI',
    document: '16592847000172',
    city: 'Londrina',
    state: 'PR',
    street: 'Avenida Tiradentes',
    number: '3100',
    district: 'Gleba Fazenda Palhano',
    zip: '86050-000',
    email: 'projetos@ppi-teste.com',
    phone: '(43) 3322-1500',
  },
];

function fail(label, error) {
  console.error(label, error?.message || error);
  process.exit(1);
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('is_active', true)
  .is('deleted_at', null)
  .limit(1)
  .maybeSingle();
if (profileError || !profile) fail('Perfil admin não encontrado', profileError);

const { data: equipment, error: equipmentError } = await supabase
  .from('equipment')
  .select('id, name, daily_cents, monthly_cents, km_cents')
  .is('deleted_at', null)
  .eq('available_for_quote', true)
  .order('sort_order', { ascending: true });
if (equipmentError || !equipment?.length) fail('Nenhum equipamento disponível', equipmentError);

const { data: settings, error: settingsError } = await supabase
  .from('company_settings')
  .select('id, quote_prefix, quote_next_seq, numbering_year')
  .eq('id', '00000000-0000-0000-0000-000000000001')
  .single();
if (settingsError || !settings) fail('Configuração da empresa não encontrada', settingsError);

const year = new Date().getFullYear();
let seq = settings.numbering_year === year ? settings.quote_next_seq : 1;
const created = [];

for (const [index, client] of CLIENTS.entries()) {
  const { data: existing } = await supabase
    .from('customers')
    .select('id, legal_name')
    .eq('document', client.document)
    .is('deleted_at', null)
    .maybeSingle();

  let customer = existing;
  if (!customer) {
    const inserted = await supabase
      .from('customers')
      .insert({
        person_type: 'pj',
        legal_name: client.legal_name,
        trade_name: client.trade_name,
        document: client.document,
        email: client.email,
        phone: client.phone,
        whatsapp_ddi: '55',
        zip: client.zip,
        street: client.street,
        number: client.number,
        district: client.district,
        city: client.city,
        state: client.state,
        notes: '[TESTE] Cliente de demonstração. Pode excluir.',
        status: 'active',
        created_by: profile.id,
      })
      .select('id, legal_name')
      .single();
    if (inserted.error || !inserted.data) fail(`Falha ao criar ${client.legal_name}`, inserted.error);
    customer = inserted.data;
  }

  const primary = equipment[index % equipment.length];
  const extra = equipment[(index + 1) % equipment.length];
  const days = [5, 8, 12, 4, 10][index];
  const items = [
    {
      equipment_id: primary.id,
      kind: 'equipment',
      description: `Locação de ${primary.name} com operador`,
      unit: 'daily',
      quantity: days,
      unit_price_cents: primary.daily_cents,
      discount_cents: 0,
      surcharge_cents: 0,
      subtotal_cents: Math.round(primary.daily_cents * days),
      monthly_recommendation: days >= 15 && primary.monthly_cents > 0,
      sort_order: 0,
    },
  ];
  if (extra.id !== primary.id) {
    items.push({
      equipment_id: extra.id,
      kind: 'equipment',
      description: `Locação de ${extra.name}`,
      unit: 'daily',
      quantity: 2,
      unit_price_cents: extra.daily_cents,
      discount_cents: 0,
      surcharge_cents: 0,
      subtotal_cents: Math.round(extra.daily_cents * 2),
      monthly_recommendation: false,
      sort_order: 1,
    });
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal_cents, 0);
  const number = `${settings.quote_prefix}-${year}-${String(seq).padStart(4, '0')}`;
  seq += 1;

  const quoteInsert = await supabase
    .from('quotes')
    .insert({
      number,
      customer_id: customer.id,
      owner_id: profile.id,
      created_by: profile.id,
      status: 'draft',
      title: `Locação para ${client.trade_name}`,
    })
    .select('id, number')
    .single();
  if (quoteInsert.error || !quoteInsert.data) fail(`Falha ao criar orçamento ${number}`, quoteInsert.error);

  const issued = new Date();
  const valid = new Date(issued);
  valid.setDate(valid.getDate() + 15);
  const start = new Date(issued);
  start.setDate(start.getDate() + 7);
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);

  const versionInsert = await supabase
    .from('quote_versions')
    .insert({
      quote_id: quoteInsert.data.id,
      version_number: 1,
      issued_at: issued.toISOString().slice(0, 10),
      valid_until: valid.toISOString().slice(0, 10),
      title: `Locação para ${client.trade_name}`,
      description: 'Orçamento de teste para validação do painel.',
      scope: 'Locação de equipamentos com operador para apoio à montagem industrial.',
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      payment_terms: '50% na aprovação e 50% na desmobilização.',
      payment_deadline: '15 dias',
      internal_notes: '[TESTE] Orçamento de demonstração.',
      status: 'draft',
      subtotal_cents: itemsSubtotal,
      discount_cents: 0,
      surcharge_cents: 0,
      tax_cents: 0,
      total_cents: itemsSubtotal,
      total_extenso: centsToExtenso(itemsSubtotal),
      created_by: profile.id,
    })
    .select('id')
    .single();
  if (versionInsert.error || !versionInsert.data) fail(`Falha na versão de ${number}`, versionInsert.error);

  const itemsInsert = await supabase.from('quote_items').insert(
    items.map((item) => ({
      quote_version_id: versionInsert.data.id,
      ...item,
    })),
  );
  if (itemsInsert.error) fail(`Falha nos itens de ${number}`, itemsInsert.error);

  const link = await supabase
    .from('quotes')
    .update({ current_version_id: versionInsert.data.id })
    .eq('id', quoteInsert.data.id);
  if (link.error) fail(`Falha ao vincular versão de ${number}`, link.error);

  created.push({
    customer: customer.legal_name,
    number: quoteInsert.data.number,
    total: (itemsSubtotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  });
}

await supabase
  .from('company_settings')
  .update({ quote_next_seq: seq, numbering_year: year })
  .eq('id', settings.id);

for (const row of created) {
  console.log(`${row.number} · ${row.customer} · ${row.total}`);
}
console.log('Pronto: 5 clientes e 5 orçamentos de teste.');
