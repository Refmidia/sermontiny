import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL || 'admin@sermontinymontagens.com.br';
const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.error('Defina ADMIN_PASSWORD no ambiente antes de criar o administrador.');
  process.exit(1);
}
const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: 'Administrador Sermontiny' },
});

let user = created?.user;
if (createError) {
  if (!/already|registered|exists/i.test(createError.message)) {
    console.error('Falha ao criar usuário:', createError.message);
    process.exit(1);
  }
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Usuário já existe, mas não foi possível listar:', listError.message);
    process.exit(1);
  }
  user = list.users.find((item) => item.email === email);
  if (!user) {
    console.error('Usuário já existe, mas não foi encontrado na listagem.');
    process.exit(1);
  }
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (updateError) {
    console.error('Falha ao atualizar a senha:', updateError.message);
    process.exit(1);
  }
}

const { data: role, error: roleError } = await supabase
  .from('roles')
  .select('id')
  .eq('slug', 'administrator')
  .maybeSingle();

if (roleError || !role) {
  console.log(
    JSON.stringify({
      ok: true,
      email,
      userId: user.id,
      profileActivated: false,
      reason: 'Schema ainda não aplicado. Execute 0001_init.sql e seed.sql no SQL Editor.',
    }),
  );
  process.exit(0);
}

const { error: upsertError } = await supabase.from('profiles').upsert({
  id: user.id,
  full_name: 'Administrador Sermontiny',
  role_id: role.id,
  is_active: true,
  deleted_at: null,
});

if (upsertError) {
  console.log(
    JSON.stringify({
      ok: true,
      email,
      userId: user.id,
      profileActivated: false,
      reason: upsertError.message,
    }),
  );
  process.exit(0);
}

console.log(
  JSON.stringify({
    ok: true,
    email,
    userId: user.id,
    profileActivated: true,
  }),
);
