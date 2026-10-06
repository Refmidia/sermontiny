-- Foto do funcionário / perfil
alter table public.profiles
  add column if not exists photo_path text;
