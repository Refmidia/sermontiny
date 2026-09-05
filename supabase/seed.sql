-- Seed funcional. Execute após 0001_init.sql.
-- O primeiro administrador NÃO é criado aqui. Crie o usuário no Auth do Supabase
-- e depois execute supabase/seed_admin.sql.

insert into public.roles (slug, name, description) values
  ('administrator', 'Administrador', 'Acesso total ao painel e às configurações.'),
  ('board', 'Diretoria', 'Visão completa com restrição apenas à gestão de usuários.'),
  ('commercial', 'Comercial', 'Clientes, leads, orçamentos e envios.'),
  ('estimator', 'Orçamentista', 'Elaboração, revisão e aprovação de orçamentos.'),
  ('contract_manager', 'Gestor de contratos', 'Contratos, cláusulas e documentos contratuais.'),
  ('finance', 'Financeiro', 'Consulta de valores, contratos e documentos.'),
  ('viewer', 'Consulta', 'Somente leitura operacional.')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

insert into public.permissions (slug, name) values
  ('dashboard.read', 'Ver dashboard'),
  ('customers.read', 'Ver clientes'),
  ('customers.write', 'Editar clientes'),
  ('customers.delete', 'Excluir clientes'),
  ('equipment.read', 'Ver equipamentos'),
  ('equipment.write', 'Editar equipamentos'),
  ('equipment.delete', 'Excluir equipamentos'),
  ('prices.write', 'Alterar preços'),
  ('quotes.read', 'Ver orçamentos'),
  ('quotes.write', 'Editar orçamentos'),
  ('quotes.approve', 'Aprovar orçamentos'),
  ('quotes.delete', 'Excluir orçamentos'),
  ('contracts.read', 'Ver contratos'),
  ('contracts.write', 'Editar contratos'),
  ('contracts.sign', 'Registrar assinatura'),
  ('contracts.delete', 'Excluir contratos'),
  ('leads.read', 'Ver contatos'),
  ('leads.write', 'Editar contatos'),
  ('finance.read', 'Ver dados financeiros'),
  ('settings.read', 'Ver configurações'),
  ('settings.write', 'Editar configurações'),
  ('users.read', 'Ver usuários'),
  ('users.write', 'Editar usuários'),
  ('audit.read', 'Ver auditoria'),
  ('documents.read', 'Ver documentos'),
  ('documents.write', 'Gerenciar documentos'),
  ('whatsapp.send', 'Enviar WhatsApp')
on conflict (slug) do update set name = excluded.name;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.slug = 'administrator'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug <> 'users.write'
where r.slug = 'board'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in (
  'dashboard.read','customers.read','customers.write','equipment.read','quotes.read','quotes.write',
  'contracts.read','leads.read','leads.write','documents.read','documents.write','whatsapp.send'
)
where r.slug = 'commercial'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in (
  'dashboard.read','customers.read','equipment.read','quotes.read','quotes.write','quotes.approve',
  'contracts.read','leads.read','documents.read','documents.write','whatsapp.send'
)
where r.slug = 'estimator'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in (
  'dashboard.read','customers.read','equipment.read','quotes.read','contracts.read','contracts.write',
  'contracts.sign','documents.read','documents.write','whatsapp.send'
)
where r.slug = 'contract_manager'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in (
  'dashboard.read','customers.read','equipment.read','quotes.read','contracts.read','finance.read','documents.read'
)
where r.slug = 'finance'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in (
  'dashboard.read','customers.read','equipment.read','quotes.read','contracts.read','leads.read','documents.read'
)
where r.slug = 'viewer'
on conflict do nothing;

insert into public.company_settings (
  id, legal_name, trade_name, cnpj, state_registration,
  street, number, district, city, state, zip,
  email, website, default_payment_terms, default_commercial_terms
) values (
  '00000000-0000-0000-0000-000000000001',
  'Sermontiny Montagens Industriais LTDA',
  'Sermontiny Montagens Industriais e Locações',
  '10.750.978/0001-24',
  '731.067.344.116',
  'Rua Cambará',
  '319',
  'Distrito Industrial',
  'Tarumã',
  'SP',
  '19820-000',
  'comercial@sermontinymontagens.com.br',
  'https://www.sermontinymontagens.com.br',
  'Faturamento mediante medição do período executado, com pagamento no prazo combinado em proposta.',
  'Valores expressos em Reais. A proposta considera jornada comercial e mínimo de dez horas por diária, salvo disposição em contrário.'
) on conflict (id) do update set
  legal_name = excluded.legal_name,
  trade_name = excluded.trade_name,
  cnpj = excluded.cnpj,
  state_registration = excluded.state_registration;

insert into public.equipment (
  name, slug, brand, model, capacity_tons, description, technical_features,
  daily_cents, monthly_cents, hourly_cents, km_cents, available_for_quote, show_on_website,
  name_needs_confirmation, sort_order, notes
) values
  (
    'Guindaste Madal MD 30 t',
    'guindaste-madal-md-30t',
    'Madal',
    'MD',
    30,
    'Guindaste para montagens industriais e movimentação de cargas em usinas e obras.',
    'Capacidade de 30 toneladas. Indicado para içamentos de médio porte em ambientes industriais.',
    280000, 4500000, 0, 0, true, true, false, 10, null
  ),
  (
    'Guindaste XCMG 60 t',
    'guindaste-xcmg-60t',
    'XCMG',
    '60 t',
    60,
    'Guindaste de 60 toneladas para montagens pesadas e operações de maior alcance.',
    'Capacidade de 60 toneladas. Adequado para estruturas metálicas e equipamentos de processo.',
    320000, 5500000, 0, 0, true, true, false, 20, null
  ),
  (
    'Guindaste XCMG 70 t',
    'guindaste-xcmg-70t',
    'XCMG',
    '70 t',
    70,
    'Guindaste de 70 toneladas para içamentos industriais de maior porte.',
    'Capacidade de 70 toneladas. Uso em usinas, reservatórios e estruturas de grande porte.',
    350000, 6000000, 0, 0, true, true, false, 30, null
  ),
  (
    'Guindaste Zoonlaine/Zoomlion 90 t',
    'guindaste-90t',
    'Zoonlaine/Zoomlion',
    '90 t',
    90,
    'Equipamento de 90 toneladas para operações pesadas. Nome comercial sujeito a confirmação.',
    'Capacidade de 90 toneladas. Conferir marca e modelo oficiais antes da emissão definitiva.',
    450000, 8500000, 0, 0, true, true, true, 40,
    'Nome provisório. Confirmar se a marca correta é Zoonlaine ou Zoomlion antes de publicar documentos finais.'
  ),
  (
    'Munck TKA 35 t',
    'munck-tka-35t',
    'TKA',
    '35 t',
    35,
    'Caminhão munck TKA para carga, descarga e posicionamento de materiais.',
    'Capacidade de 35 toneladas. Operação urbana e industrial com agilidade de mobilização.',
    200000, 3600000, 0, 0, true, true, false, 50, null
  ),
  (
    'Munck TKA 45 t',
    'munck-tka-45t',
    'TKA',
    '45 t',
    45,
    'Caminhão munck TKA de maior capacidade para peças e estruturas.',
    'Capacidade de 45 toneladas. Indicado para peças longas e equipamentos industriais.',
    220000, 3800000, 0, 0, true, true, false, 60, null
  ),
  (
    'Munck Rodomaq 25 t',
    'munck-rodomaq-25t',
    'Rodomaq',
    '25 t',
    25,
    'Caminhão munck Rodomaq para apoio a montagens e movimentações de médio porte.',
    'Capacidade de 25 toneladas. Apoio logístico e içamentos auxiliares.',
    180000, 3200000, 0, 0, true, true, false, 70, null
  ),
  (
    'Caminhão-prancha 2 eixos',
    'caminhao-prancha-2-eixos',
    null,
    '2 eixos',
    null,
    'Transporte de equipamentos e estruturas em caminhão-prancha de 2 eixos.',
    'Cobrança por quilômetro rodado. Dimensões e peso da carga devem ser informados no orçamento.',
    0, 0, 0, 1500, true, true, false, 80, 'Valor de referência: R$ 15 por quilômetro.'
  ),
  (
    'Mobilização e desmobilização',
    'mobilizacao-desmobilizacao',
    null,
    null,
    null,
    'Serviço de mobilização e desmobilização de equipamentos até o local da obra.',
    'Cobrança por quilômetro. Pedágios, escoltas e horas de espera devem ser tratados à parte quando aplicável.',
    0, 0, 0, 1000, true, true, false, 90, 'Valor de referência: R$ 10 por quilômetro.'
  )
on conflict (slug) do update set
  daily_cents = excluded.daily_cents,
  monthly_cents = excluded.monthly_cents,
  km_cents = excluded.km_cents,
  notes = excluded.notes;

insert into public.clause_library (slug, title, body, requires_responsibility, sort_order) values
  ('jornada-comercial', 'Jornada comercial', 'A jornada comercial considera o horário ordinário de trabalho em dias úteis, conforme combinado na proposta e no cronograma da obra.', false, 10),
  ('minimo-dez-horas', 'Mínimo de dez horas por diária', 'Cada diária considera o mínimo de dez horas. Horas excedentes seguem as condições de hora adicional previstas neste instrumento.', false, 20),
  ('hora-adicional-50', 'Hora adicional de 50%', 'As horas excedentes à jornada comercial, em dias úteis, serão acrescidas de 50% sobre o valor da hora ordinária.', false, 30),
  ('domingo-feriado-100', 'Domingo e feriado com adicional de 100%', 'Os serviços executados em domingos e feriados serão acrescidos de 100% sobre o valor da hora ordinária.', false, 40),
  ('operador', 'Operador', 'O equipamento será acompanhado de operador qualificado da CONTRATADA, salvo se o contrato especificar operação pelo tomador.', false, 50),
  ('combustivel', 'Combustível', 'A responsabilidade pelo fornecimento de combustível deve ser definida expressamente neste contrato, sem presunção automática.', true, 60),
  ('epi', 'EPI', 'A CONTRATADA fornece EPI de seus colaboradores. A CONTRATANTE deve garantir as condições de acesso e as exigências específicas do site.', false, 70),
  ('alimentacao', 'Alimentação', 'A responsabilidade pela alimentação da equipe deve ser definida expressamente neste contrato.', true, 80),
  ('hospedagem', 'Hospedagem', 'A responsabilidade pela hospedagem da equipe deve ser definida expressamente neste contrato.', true, 90),
  ('ajudante', 'Ajudante', 'A responsabilidade pelo fornecimento de ajudante de área deve ser definida expressamente neste contrato.', true, 100),
  ('mobilizacao', 'Mobilização', 'A mobilização e a desmobilização seguem as distâncias, prazos e valores descritos no orçamento aprovado.', true, 110),
  ('plano-de-rigging', 'Plano de rigging', 'Quando exigido, o plano de rigging só será emitido após definição clara da parte responsável pela elaboração, custos e aprovação no site.', true, 120),
  ('treinamentos', 'Treinamentos', 'Treinamentos específicos exigidos pela CONTRATANTE, além dos já detidos pela equipe, serão orçados à parte quando não inclusos.', false, 130),
  ('faturamento-medicao', 'Faturamento e medição', 'O faturamento observará a medição do período efetivamente executado, conforme diário de obra ou relatório de operação aprovado pelas partes.', false, 140),
  ('validade', 'Validade', 'Este instrumento vigorará pelo prazo nele indicado, podendo ser prorrogado por acordo escrito entre as partes.', false, 150),
  ('responsabilidades', 'Responsabilidades das partes', 'Cada parte responderá pelos atos de seus prepostos, pelo cumprimento das normas de segurança e pelas obrigações expressamente atribuídas neste contrato.', false, 160)
on conflict (slug) do update set title = excluded.title, body = excluded.body;
