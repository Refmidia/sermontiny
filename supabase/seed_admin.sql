-- Promove o primeiro administrador.
-- 1. Crie o usuário no Authentication do Supabase (e-mail e senha).
-- 2. Substitua o e-mail abaixo.
-- 3. Execute este script no SQL Editor.

do $$
declare
  admin_email text := 'admin@sermontinymontagens.com.br';
  admin_id uuid;
  admin_role uuid;
begin
  select id into admin_id from auth.users where email = admin_email;
  if admin_id is null then
    raise exception 'Usuário % ainda não existe no Auth. Crie-o no painel do Supabase antes de executar este script.', admin_email;
  end if;

  select id into admin_role from public.roles where slug = 'administrator';

  update public.profiles
    set role_id = admin_role,
        is_active = true,
        full_name = coalesce(nullif(full_name, ''), 'Administrador Sermontiny')
    where id = admin_id;

  if not found then
    insert into public.profiles (id, full_name, role_id, is_active)
    values (admin_id, 'Administrador Sermontiny', admin_role, true);
  end if;
end $$;
