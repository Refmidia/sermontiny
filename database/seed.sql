-- Dados iniciais. Pode rodar mais de uma vez: só cria o que faltar.
SET NAMES utf8mb4;

INSERT INTO roles (id, slug, name, description) VALUES
  (UUID(), 'administrator', 'Administrador', 'Acesso total ao painel e às configurações.'),
  (UUID(), 'board', 'Diretoria', 'Visão completa com restrição apenas à gestão de usuários.'),
  (UUID(), 'commercial', 'Comercial', 'Clientes, leads, orçamentos e envios.'),
  (UUID(), 'estimator', 'Orçamentista', 'Elaboração, revisão e aprovação de orçamentos.'),
  (UUID(), 'contract_manager', 'Gestor de contratos', 'Contratos, cláusulas e documentos contratuais.'),
  (UUID(), 'finance', 'Financeiro', 'Consulta de valores, contratos e documentos.'),
  (UUID(), 'viewer', 'Consulta', 'Somente leitura operacional.')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO permissions (id, slug, name) VALUES
  (UUID(), 'dashboard.read', 'Ver dashboard'),
  (UUID(), 'customers.read', 'Ver clientes'),
  (UUID(), 'customers.write', 'Editar clientes'),
  (UUID(), 'customers.delete', 'Excluir clientes'),
  (UUID(), 'equipment.read', 'Ver equipamentos'),
  (UUID(), 'equipment.write', 'Editar equipamentos'),
  (UUID(), 'equipment.delete', 'Excluir equipamentos'),
  (UUID(), 'prices.write', 'Alterar preços'),
  (UUID(), 'quotes.read', 'Ver orçamentos'),
  (UUID(), 'quotes.write', 'Editar orçamentos'),
  (UUID(), 'quotes.approve', 'Aprovar orçamentos'),
  (UUID(), 'quotes.delete', 'Excluir orçamentos'),
  (UUID(), 'contracts.read', 'Ver contratos'),
  (UUID(), 'contracts.write', 'Editar contratos'),
  (UUID(), 'contracts.sign', 'Registrar assinatura'),
  (UUID(), 'contracts.delete', 'Excluir contratos'),
  (UUID(), 'leads.read', 'Ver contatos'),
  (UUID(), 'leads.write', 'Editar contatos'),
  (UUID(), 'finance.read', 'Ver dados financeiros'),
  (UUID(), 'settings.read', 'Ver configurações'),
  (UUID(), 'settings.write', 'Editar configurações'),
  (UUID(), 'users.read', 'Ver usuários'),
  (UUID(), 'users.write', 'Editar usuários'),
  (UUID(), 'audit.read', 'Ver auditoria'),
  (UUID(), 'documents.read', 'Ver documentos'),
  (UUID(), 'documents.write', 'Gerenciar documentos'),
  (UUID(), 'whatsapp.send', 'Enviar WhatsApp')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p WHERE r.slug = 'administrator';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug <> 'users.write' WHERE r.slug = 'board';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'dashboard.read','customers.read','customers.write','equipment.read','quotes.read','quotes.write',
  'contracts.read','leads.read','leads.write','documents.read','documents.write','whatsapp.send'
) WHERE r.slug = 'commercial';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'dashboard.read','customers.read','equipment.read','quotes.read','quotes.write','quotes.approve',
  'contracts.read','leads.read','documents.read','documents.write','whatsapp.send'
) WHERE r.slug = 'estimator';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'dashboard.read','customers.read','equipment.read','quotes.read','contracts.read','contracts.write',
  'contracts.sign','documents.read','documents.write','whatsapp.send'
) WHERE r.slug = 'contract_manager';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'dashboard.read','customers.read','equipment.read','quotes.read','contracts.read','finance.read','documents.read'
) WHERE r.slug = 'finance';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'dashboard.read','customers.read','equipment.read','quotes.read','contracts.read','leads.read','documents.read'
) WHERE r.slug = 'viewer';

INSERT IGNORE INTO company_settings (
  id, legal_name, trade_name, cnpj, state_registration,
  street, number, district, city, state, zip, phones, whatsapp,
  email, website, pix_key, numbering_year, default_payment_terms, default_commercial_terms
) VALUES (
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
  '["(18) 98147-2719"]',
  '(18) 98147-2719',
  'comercial@sermontinymontagens.com.br',
  'https://www.sermontinymontagens.com.br',
  '10.750.978/0001-24',
  YEAR(CURRENT_DATE),
  'Faturamento mediante medição do período executado, com pagamento no prazo combinado em proposta.',
  'Valores expressos em Reais. A proposta considera jornada comercial e mínimo de dez horas por diária, salvo disposição em contrário.'
);

INSERT IGNORE INTO equipment (
  id, name, slug, brand, model, capacity_tons, description, technical_features,
  daily_cents, monthly_cents, hourly_cents, km_cents, available_for_quote, show_on_website,
  name_needs_confirmation, sort_order, notes
) VALUES
  (UUID(), 'Guindaste Madal MD 30 t', 'guindaste-madal-md-30t', 'Madal', 'MD', 30,
    'Guindaste para montagens industriais e movimentação de cargas em usinas e obras.',
    'Capacidade de 30 toneladas. Indicado para içamentos de médio porte em ambientes industriais.',
    280000, 4500000, 0, 0, 1, 1, 0, 10, NULL),
  (UUID(), 'Guindaste XCMG 60 t', 'guindaste-xcmg-60t', 'XCMG', '60 t', 60,
    'Guindaste de 60 toneladas para montagens pesadas e operações de maior alcance.',
    'Capacidade de 60 toneladas. Adequado para estruturas metálicas e equipamentos de processo.',
    320000, 5500000, 0, 0, 1, 1, 0, 20, NULL),
  (UUID(), 'Guindaste XCMG 70 t', 'guindaste-xcmg-70t', 'XCMG', '70 t', 70,
    'Guindaste de 70 toneladas para içamentos industriais de maior porte.',
    'Capacidade de 70 toneladas. Uso em usinas, reservatórios e estruturas de grande porte.',
    350000, 6000000, 0, 0, 1, 1, 0, 30, NULL),
  (UUID(), 'Guindaste Zoonlaine/Zoomlion 90 t', 'guindaste-90t', 'Zoonlaine/Zoomlion', '90 t', 90,
    'Equipamento de 90 toneladas para operações pesadas. Nome comercial sujeito a confirmação.',
    'Capacidade de 90 toneladas. Conferir marca e modelo oficiais antes da emissão definitiva.',
    450000, 8500000, 0, 0, 1, 1, 1, 40,
    'Nome provisório. Confirmar se a marca correta é Zoonlaine ou Zoomlion antes de publicar documentos finais.'),
  (UUID(), 'Munck TKA 35 t', 'munck-tka-35t', 'TKA', '35 t', 35,
    'Caminhão munck TKA para carga, descarga e posicionamento de materiais.',
    'Capacidade de 35 toneladas. Operação urbana e industrial com agilidade de mobilização.',
    200000, 3600000, 0, 0, 1, 1, 0, 50, NULL),
  (UUID(), 'Munck TKA 45 t', 'munck-tka-45t', 'TKA', '45 t', 45,
    'Caminhão munck TKA de maior capacidade para peças e estruturas.',
    'Capacidade de 45 toneladas. Indicado para peças longas e equipamentos industriais.',
    220000, 3800000, 0, 0, 1, 1, 0, 60, NULL),
  (UUID(), 'Munck Rodomaq 25 t', 'munck-rodomaq-25t', 'Rodomaq', '25 t', 25,
    'Caminhão munck Rodomaq para apoio a montagens e movimentações de médio porte.',
    'Capacidade de 25 toneladas. Apoio logístico e içamentos auxiliares.',
    180000, 3200000, 0, 0, 1, 1, 0, 70, NULL),
  (UUID(), 'Caminhão-prancha 2 eixos', 'caminhao-prancha-2-eixos', NULL, '2 eixos', NULL,
    'Transporte de equipamentos e estruturas em caminhão-prancha de 2 eixos.',
    'Cobrança por quilômetro rodado. Dimensões e peso da carga devem ser informados no orçamento.',
    0, 0, 0, 1500, 1, 1, 0, 80, 'Valor de referência: R$ 15 por quilômetro.'),
  (UUID(), 'Mobilização e desmobilização', 'mobilizacao-desmobilizacao', NULL, NULL, NULL,
    'Serviço de mobilização e desmobilização de equipamentos até o local da obra.',
    'Cobrança por quilômetro. Pedágios, escoltas e horas de espera devem ser tratados à parte quando aplicável.',
    0, 0, 0, 1000, 1, 1, 0, 90, 'Valor de referência: R$ 10 por quilômetro.');

INSERT INTO clause_library (id, slug, title, body, requires_responsibility, sort_order) VALUES
  (UUID(), 'jornada-comercial', 'Jornada comercial', 'A jornada comercial considera o horário ordinário de trabalho em dias úteis, conforme combinado na proposta e no cronograma da obra.', 0, 10),
  (UUID(), 'minimo-dez-horas', 'Mínimo de dez horas por diária', 'Cada diária considera o mínimo de dez horas. Horas excedentes seguem as condições de hora adicional previstas neste instrumento.', 0, 20),
  (UUID(), 'hora-adicional-50', 'Hora adicional de 50%', 'As horas excedentes à jornada comercial, em dias úteis, serão acrescidas de 50% sobre o valor da hora ordinária.', 0, 30),
  (UUID(), 'domingo-feriado-100', 'Domingo e feriado com adicional de 100%', 'Os serviços executados em domingos e feriados serão acrescidos de 100% sobre o valor da hora ordinária.', 0, 40),
  (UUID(), 'operador', 'Operador', 'O equipamento será acompanhado de operador qualificado da CONTRATADA, salvo se o contrato especificar operação pelo tomador.', 0, 50),
  (UUID(), 'combustivel', 'Combustível', 'A responsabilidade pelo fornecimento de combustível deve ser definida expressamente neste contrato, sem presunção automática.', 1, 60),
  (UUID(), 'epi', 'EPI', 'A CONTRATADA fornece EPI de seus colaboradores. A CONTRATANTE deve garantir as condições de acesso e as exigências específicas do site.', 0, 70),
  (UUID(), 'alimentacao', 'Alimentação', 'A responsabilidade pela alimentação da equipe deve ser definida expressamente neste contrato.', 1, 80),
  (UUID(), 'hospedagem', 'Hospedagem', 'A responsabilidade pela hospedagem da equipe deve ser definida expressamente neste contrato.', 1, 90),
  (UUID(), 'ajudante', 'Ajudante', 'A responsabilidade pelo fornecimento de ajudante de área deve ser definida expressamente neste contrato.', 1, 100),
  (UUID(), 'mobilizacao', 'Mobilização', 'A mobilização e a desmobilização seguem as distâncias, prazos e valores descritos no orçamento aprovado.', 1, 110),
  (UUID(), 'plano-de-rigging', 'Plano de rigging', 'Quando exigido, o plano de rigging só será emitido após definição clara da parte responsável pela elaboração, custos e aprovação no site.', 1, 120),
  (UUID(), 'treinamentos', 'Treinamentos', 'Treinamentos específicos exigidos pela CONTRATANTE, além dos já detidos pela equipe, serão orçados à parte quando não inclusos.', 0, 130),
  (UUID(), 'faturamento-medicao', 'Faturamento e medição', 'O faturamento observará a medição do período efetivamente executado, conforme diário de obra ou relatório de operação aprovado pelas partes.', 0, 140),
  (UUID(), 'validade', 'Validade', 'Este instrumento vigorará pelo prazo nele indicado, podendo ser prorrogado por acordo escrito entre as partes.', 0, 150),
  (UUID(), 'responsabilidades', 'Responsabilidades das partes', 'Cada parte responderá pelos atos de seus prepostos, pelo cumprimento das normas de segurança e pelas obrigações expressamente atribuídas neste contrato.', 0, 160)
ON DUPLICATE KEY UPDATE title = VALUES(title), body = VALUES(body);
