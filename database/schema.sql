-- Sermontiny — esquema MySQL/MariaDB (Hostinger).
-- Datas em UTC. Booleanos em TINYINT(1). Listas e metadados em JSON (texto).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS auth_users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  last_sign_in_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY auth_users_email_uq (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY roles_slug_uq (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY permissions_slug_uq (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_fk FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_permission_fk FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  full_name VARCHAR(190) NOT NULL DEFAULT '',
  role_id CHAR(36) NULL,
  phone VARCHAR(40) NULL,
  photo_path VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  CONSTRAINT profiles_user_fk FOREIGN KEY (id) REFERENCES auth_users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_role_fk FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  legal_name VARCHAR(190) NOT NULL,
  trade_name VARCHAR(190) NOT NULL,
  cnpj VARCHAR(32) NOT NULL,
  state_registration VARCHAR(40) NULL,
  street VARCHAR(190) NULL,
  number VARCHAR(20) NULL,
  complement VARCHAR(120) NULL,
  district VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  state VARCHAR(2) NULL,
  zip VARCHAR(12) NULL,
  phones TEXT NULL,
  whatsapp VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  website VARCHAR(190) NULL,
  logo_path VARCHAR(255) NULL,
  signature_path VARCHAR(255) NULL,
  bank_name VARCHAR(120) NULL,
  bank_agency VARCHAR(40) NULL,
  bank_account VARCHAR(40) NULL,
  pix_key VARCHAR(190) NULL,
  default_payment_terms TEXT NULL,
  default_commercial_terms TEXT NULL,
  default_responsibilities TEXT NULL,
  quote_prefix VARCHAR(12) NOT NULL DEFAULT 'ORC',
  contract_prefix VARCHAR(12) NOT NULL DEFAULT 'CTR',
  quote_next_seq INT NOT NULL DEFAULT 1,
  contract_next_seq INT NOT NULL DEFAULT 1,
  numbering_year INT NOT NULL DEFAULT 2026,
  show_public_prices TINYINT(1) NOT NULL DEFAULT 0,
  whatsapp_provider VARCHAR(16) NOT NULL DEFAULT 'wa_me',
  quote_whatsapp_template VARCHAR(1000) NOT NULL DEFAULT 'Olá, {nome}. Segue o orçamento {numero}, referente a {titulo}. A proposta possui validade até {validade}. Permanecemos à disposição.',
  contract_whatsapp_template VARCHAR(1000) NOT NULL DEFAULT 'Olá, {nome}. Segue o contrato {numero}, referente a {objeto}. Por favor, confirme o recebimento. Permanecemos à disposição.',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  person_type VARCHAR(4) NOT NULL DEFAULT 'pj',
  legal_name VARCHAR(190) NOT NULL,
  trade_name VARCHAR(190) NULL,
  document VARCHAR(32) NOT NULL,
  state_registration VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  whatsapp_ddi VARCHAR(4) NOT NULL DEFAULT '55',
  whatsapp_number VARCHAR(40) NULL,
  zip VARCHAR(12) NULL,
  street VARCHAR(190) NULL,
  number VARCHAR(20) NULL,
  complement VARCHAR(120) NULL,
  district VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  state VARCHAR(2) NULL,
  notes TEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  document_active VARCHAR(32) AS (IF(deleted_at IS NULL, document, NULL)) STORED,
  UNIQUE KEY customers_document_active_uq (document_active),
  KEY customers_legal_name_idx (legal_name),
  CONSTRAINT customers_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_units (
  id CHAR(36) NOT NULL PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  name VARCHAR(190) NOT NULL,
  internal_code VARCHAR(60) NULL,
  street VARCHAR(190) NULL,
  number VARCHAR(20) NULL,
  complement VARCHAR(120) NULL,
  district VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  state VARCHAR(2) NULL,
  zip VARCHAR(12) NULL,
  manager_name VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  whatsapp VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  CONSTRAINT customer_units_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_contacts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  unit_id CHAR(36) NULL,
  name VARCHAR(190) NOT NULL,
  role VARCHAR(120) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  whatsapp VARCHAR(40) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  CONSTRAINT customer_contacts_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT customer_contacts_unit_fk FOREIGN KEY (unit_id) REFERENCES customer_units(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  brand VARCHAR(120) NULL,
  model VARCHAR(120) NULL,
  capacity_tons DECIMAL(10,2) NULL,
  plate VARCHAR(20) NULL,
  year INT NULL,
  asset_number VARCHAR(60) NULL,
  description TEXT NULL,
  technical_features TEXT NULL,
  photo_path VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'available',
  available_for_quote TINYINT(1) NOT NULL DEFAULT 1,
  show_on_website TINYINT(1) NOT NULL DEFAULT 1,
  show_availability_public TINYINT(1) NOT NULL DEFAULT 0,
  daily_cents BIGINT NOT NULL DEFAULT 0,
  monthly_cents BIGINT NOT NULL DEFAULT 0,
  hourly_cents BIGINT NOT NULL DEFAULT 0,
  km_cents BIGINT NOT NULL DEFAULT 0,
  min_hours_per_day DECIMAL(6,2) NOT NULL DEFAULT 10,
  notes TEXT NULL,
  name_needs_confirmation TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY equipment_slug_uq (slug),
  CONSTRAINT equipment_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment_price_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  equipment_id CHAR(36) NOT NULL,
  daily_cents BIGINT NOT NULL DEFAULT 0,
  monthly_cents BIGINT NOT NULL DEFAULT 0,
  hourly_cents BIGINT NOT NULL DEFAULT 0,
  km_cents BIGINT NOT NULL DEFAULT 0,
  min_hours_per_day DECIMAL(6,2) NOT NULL DEFAULT 10,
  valid_from DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  valid_to DATETIME(3) NULL,
  changed_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY equipment_price_history_current_idx (equipment_id, valid_to, valid_from),
  CONSTRAINT equipment_price_history_equipment_fk FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  CONSTRAINT equipment_price_history_changed_by_fk FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  whatsapp VARCHAR(40) NULL,
  company VARCHAR(190) NULL,
  subject VARCHAR(190) NULL,
  equipment_id CHAR(36) NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  source VARCHAR(40) NOT NULL DEFAULT 'contact_form',
  ip_hash VARCHAR(128) NULL,
  notes TEXT NULL,
  assigned_to CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  KEY leads_created_idx (created_at),
  KEY leads_status_idx (status),
  CONSTRAINT leads_equipment_fk FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
  CONSTRAINT leads_assigned_fk FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  number VARCHAR(40) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  unit_id CHAR(36) NULL,
  contact_id CHAR(36) NULL,
  owner_id CHAR(36) NULL,
  current_version_id CHAR(36) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  title VARCHAR(255) NOT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY quotes_number_uq (number),
  KEY quotes_customer_idx (customer_id, created_at),
  CONSTRAINT quotes_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT quotes_unit_fk FOREIGN KEY (unit_id) REFERENCES customer_units(id) ON DELETE SET NULL,
  CONSTRAINT quotes_contact_fk FOREIGN KEY (contact_id) REFERENCES customer_contacts(id) ON DELETE SET NULL,
  CONSTRAINT quotes_owner_fk FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT quotes_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_versions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  quote_id CHAR(36) NOT NULL,
  version_number INT NOT NULL,
  issued_at DATE NOT NULL,
  valid_until DATE NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  scope TEXT NULL,
  activity_code VARCHAR(60) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  payment_terms TEXT NULL,
  payment_deadline VARCHAR(255) NULL,
  internal_notes TEXT NULL,
  customer_notes TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  discount_cents BIGINT NOT NULL DEFAULT 0,
  surcharge_cents BIGINT NOT NULL DEFAULT 0,
  tax_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  total_extenso VARCHAR(500) NOT NULL DEFAULT '',
  locked TINYINT(1) NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY quote_versions_number_uq (quote_id, version_number),
  CONSTRAINT quote_versions_quote_fk FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  quote_version_id CHAR(36) NOT NULL,
  equipment_id CHAR(36) NULL,
  kind VARCHAR(16) NOT NULL DEFAULT 'equipment',
  additional_code VARCHAR(40) NULL,
  description TEXT NOT NULL,
  unit VARCHAR(16) NOT NULL DEFAULT 'daily',
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL DEFAULT 0,
  discount_cents BIGINT NOT NULL DEFAULT 0,
  surcharge_cents BIGINT NOT NULL DEFAULT 0,
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  monthly_recommendation TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT quote_items_version_fk FOREIGN KEY (quote_version_id) REFERENCES quote_versions(id) ON DELETE CASCADE,
  CONSTRAINT quote_items_equipment_fk FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  quote_id CHAR(36) NOT NULL,
  amount_cents BIGINT NOT NULL,
  kind VARCHAR(60) NOT NULL DEFAULT 'Sinal',
  paid_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  KEY quote_payments_quote_idx (quote_id, paid_at),
  CONSTRAINT quote_payments_quote_fk FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_payments_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clause_library (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  title VARCHAR(190) NOT NULL,
  body TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  requires_responsibility TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY clause_library_slug_uq (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contracts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  number VARCHAR(40) NOT NULL,
  quote_id CHAR(36) NULL,
  quote_version_id CHAR(36) NULL,
  customer_id CHAR(36) NOT NULL,
  unit_id CHAR(36) NULL,
  object TEXT NOT NULL,
  scope TEXT NULL,
  starts_on DATE NULL,
  ends_on DATE NULL,
  signed_at DATE NULL,
  billing_method VARCHAR(255) NULL,
  payment_deadline VARCHAR(255) NULL,
  total_cents BIGINT NOT NULL DEFAULT 0,
  food_party VARCHAR(20) NULL,
  lodging_party VARCHAR(20) NULL,
  fuel_party VARCHAR(20) NULL,
  transport_party VARCHAR(20) NULL,
  helper_party VARCHAR(20) NULL,
  rigging_party VARCHAR(20) NULL,
  notes TEXT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  current_version_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY contracts_number_uq (number),
  KEY contracts_customer_idx (customer_id, created_at),
  KEY contracts_ends_on_idx (ends_on),
  CONSTRAINT contracts_quote_fk FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
  CONSTRAINT contracts_quote_version_fk FOREIGN KEY (quote_version_id) REFERENCES quote_versions(id) ON DELETE SET NULL,
  CONSTRAINT contracts_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT contracts_unit_fk FOREIGN KEY (unit_id) REFERENCES customer_units(id) ON DELETE SET NULL,
  CONSTRAINT contracts_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_versions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  version_number INT NOT NULL,
  object TEXT NOT NULL,
  scope TEXT NULL,
  responsibilities TEXT NULL,
  payment_terms TEXT NULL,
  total_cents BIGINT NOT NULL DEFAULT 0,
  locked TINYINT(1) NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY contract_versions_number_uq (contract_id, version_number),
  CONSTRAINT contract_versions_contract_fk FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT contract_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_clauses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  contract_version_id CHAR(36) NOT NULL,
  library_id CHAR(36) NULL,
  title VARCHAR(190) NOT NULL,
  body TEXT NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT contract_clauses_version_fk FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE CASCADE,
  CONSTRAINT contract_clauses_library_fk FOREIGN KEY (library_id) REFERENCES clause_library(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  customer_id CHAR(36) NULL,
  quote_id CHAR(36) NULL,
  quote_version_id CHAR(36) NULL,
  contract_id CHAR(36) NULL,
  contract_version_id CHAR(36) NULL,
  storage_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL DEFAULT 'application/pdf',
  is_immutable TINYINT(1) NOT NULL DEFAULT 0,
  access_token VARCHAR(128) NULL,
  token_expires_at DATETIME(3) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY documents_access_token_uq (access_token),
  CONSTRAINT documents_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT documents_quote_fk FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
  CONSTRAINT documents_quote_version_fk FOREIGN KEY (quote_version_id) REFERENCES quote_versions(id) ON DELETE SET NULL,
  CONSTRAINT documents_contract_fk FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
  CONSTRAINT documents_contract_version_fk FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE SET NULL,
  CONSTRAINT documents_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  provider VARCHAR(16) NOT NULL,
  to_number VARCHAR(40) NOT NULL,
  template_used VARCHAR(120) NULL,
  body TEXT NOT NULL,
  document_id CHAR(36) NULL,
  quote_id CHAR(36) NULL,
  contract_id CHAR(36) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  provider_message_id VARCHAR(190) NULL,
  error_message TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT whatsapp_messages_document_fk FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  CONSTRAINT whatsapp_messages_quote_fk FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
  CONSTRAINT whatsapp_messages_contract_fk FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
  CONSTRAINT whatsapp_messages_created_by_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action VARCHAR(24) NOT NULL,
  entity VARCHAR(60) NOT NULL,
  entity_id CHAR(36) NULL,
  metadata TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY audit_logs_created_idx (created_at),
  CONSTRAINT audit_logs_actor_fk FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Arquivos (fotos, logos, PDFs) guardados no próprio banco.
CREATE TABLE IF NOT EXISTS storage_objects (
  bucket VARCHAR(40) NOT NULL,
  path VARCHAR(255) NOT NULL,
  content LONGBLOB NOT NULL,
  content_type VARCHAR(120) NOT NULL DEFAULT 'application/octet-stream',
  size INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (bucket, path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
