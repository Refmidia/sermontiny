'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  UserX,
  Users,
} from 'lucide-react';
import {
  createAdminUser,
  softDeleteAdminUser,
  updateAdminUser,
  type AdminUserRow,
} from '@/app/actions/users';
import { EmptyState } from '@/components/admin/empty-state';
import { PageActionBar } from '@/components/admin/page-action-bar';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioCards } from '@/components/ui/radio-cards';
import { compressAvatarFile } from '@/lib/images/compress-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROLE_LABELS, type RoleSlug } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type RoleOption = { id: string; name: string; slug: string };
type FilterKey = 'all' | 'active' | 'inactive';
type SortKey = 'name_asc' | 'name_desc' | 'role_asc';

const PAGE_SIZE = 10;

function roleDescription(slug: string) {
  switch (slug as RoleSlug) {
    case 'administrator':
      return 'Acesso total ao painel, inclusive usuários.';
    case 'board':
      return 'Visão ampla sem alterar usuários.';
    case 'commercial':
      return 'Clientes, orçamentos e contatos.';
    case 'estimator':
      return 'Orçamentos e aprovação comercial.';
    case 'contract_manager':
      return 'Contratos e documentos.';
    case 'finance':
      return 'Consulta financeira e documentos.';
    case 'viewer':
      return 'Somente consulta.';
    default:
      return 'Perfil operacional do painel.';
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function UserAvatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl?: string | null;
  size?: 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === 'lg' ? 'h-16 w-16 text-sm' : 'h-9 w-9 text-[11px]';
  const px = size === 'lg' ? 64 : 36;

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        className={cn('shrink-0 rounded-full object-cover', sizeClass)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-navy font-semibold text-white',
        sizeClass,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function UsersManager({
  users,
  roles,
  canWrite,
}: {
  users: AdminUserRow[];
  roles: RoleOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('name_asc');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '');
  const [isActive, setIsActive] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const roleCards = useMemo(
    () =>
      roles.map((role) => ({
        value: role.id,
        label: ROLE_LABELS[role.slug as RoleSlug] ?? role.name,
        description: roleDescription(role.slug),
      })),
    [roles],
  );

  const kpis = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive).length;
    const inactive = total - active;
    const admins = users.filter((user) => user.roleSlug === 'administrator').length;
    return { total, active, inactive, admins };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter((user) => {
      if (filter === 'active' && !user.isActive) return false;
      if (filter === 'inactive' && user.isActive) return false;
      if (!q) return true;
      const haystack = [user.fullName, user.email, user.phone, user.roleName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    list.sort((a, b) => {
      if (sort === 'name_desc') return b.fullName.localeCompare(a.fullName, 'pt-BR');
      if (sort === 'role_asc') return (a.roleName ?? '').localeCompare(b.roleName ?? '', 'pt-BR');
      return a.fullName.localeCompare(b.fullName, 'pt-BR');
    });
    return list;
  }, [users, query, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const chips: Array<{ value: FilterKey; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Inativos' },
  ];

  function resetForm(user?: AdminUserRow | null) {
    setEditing(user ?? null);
    setFullName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
    setPassword('');
    setRoleId(user?.roleId ?? roles.find((role) => role.slug === 'commercial')?.id ?? roles[0]?.id ?? '');
    setIsActive(user?.isActive ?? true);
    setPhotoFile(null);
    setRemovePhoto(false);
    setPhotoPreview(user?.photoPath ? (user.photoUrl ?? null) : null);
  }

  function onPhotoChange(file: File | null) {
    setRemovePhoto(false);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(editing?.photoPath ? (editing.photoUrl ?? null) : null);
      return;
    }

    void (async () => {
      try {
        const compressed = await compressAvatarFile(file);
        setPhotoFile(compressed);
        const url = URL.createObjectURL(compressed);
        setPhotoPreview(url);
      } catch (error) {
        setPhotoFile(null);
        setPhotoPreview(editing?.photoPath ? (editing.photoUrl ?? null) : null);
        toast.error(error instanceof Error ? error.message : 'Não foi possível processar a foto.');
      }
    })();
  }

  function openCreate() {
    resetForm(null);
    setOpen(true);
  }

  function openEdit(user: AdminUserRow) {
    resetForm(user);
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      if (editing) {
        const nextPassword = password.trim();
        // Navegadores preenchem senha automaticamente; só altera se tiver 8+ caracteres.
        const passwordToSave = nextPassword.length >= 8 ? nextPassword : undefined;
        if (nextPassword.length > 0 && nextPassword.length < 8) {
          toast.message('Senha ignorada', {
            description: 'Para trocar a senha, use no mínimo 8 caracteres. Os demais dados serão salvos.',
          });
        }

        const result = await updateAdminUser({
          profileId: editing.id,
          fullName,
          roleId,
          isActive,
          phone,
          password: passwordToSave,
          photo: photoFile,
          removePhoto,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Usuário atualizado.');
      } else {
        const result = await createAdminUser({
          fullName,
          email,
          password,
          roleId,
          phone,
          photo: photoFile,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Usuário cadastrado.');
      }
      setOpen(false);
      router.refresh();
    });
  }

  function runDelete() {
    const target = deleteTarget;
    if (!target) return;
    startDelete(async () => {
      const result = await softDeleteAdminUser(target.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Usuário excluído.');
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários e funcionários"
        description="Cadastre acessos do painel e defina o perfil de cada colaborador."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Usuários' }]}
        actions={
          <PageActionBar>
            {canWrite ? (
              <Button type="button" onClick={openCreate}>
                <Plus />
                Cadastrar usuário
              </Button>
            ) : null}
          </PageActionBar>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Total de usuários" value={kpis.total} hint="Cadastrados" tone="bg-info-soft text-info" />
        <KpiCard icon={CheckCircle2} label="Ativos" value={kpis.active} hint="Com acesso liberado" tone="bg-success-soft text-success" />
        <KpiCard icon={UserX} label="Inativos" value={kpis.inactive} hint="Acesso bloqueado" tone="bg-paper-strong text-muted" />
        <KpiCard icon={UserCog} label="Administradores" value={kpis.admins} hint="Acesso total" tone="bg-info-soft text-info" />
      </div>

      <div className="space-y-4">
        <div className="rounded-[14px] border border-border bg-white p-4 shadow-panel sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nome, e-mail, telefone ou perfil"
                className="h-11 rounded-xl border-border bg-white pl-9 shadow-none focus-visible:ring-navy/20"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
              <div className="flex flex-wrap items-center gap-2">
                {chips.map((chip) => {
                  const active = filter === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => {
                        setFilter(chip.value);
                        setPage(1);
                      }}
                      className={cn(
                        'h-11 rounded-xl border px-4 text-[13px] font-semibold transition',
                        active
                          ? 'border-navy bg-navy text-white'
                          : 'border-border bg-white text-navy hover:border-navy/30 hover:bg-paper',
                      )}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              <label className="relative inline-flex shrink-0 items-center">
                <span className="sr-only">Ordenar usuários</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-11 min-w-[160px] appearance-none rounded-xl border border-border bg-white px-3 pr-9 text-sm font-medium text-navy outline-none transition focus:border-navy/40 focus:ring-2 focus:ring-navy/15"
                  aria-label="Ordenar usuários"
                >
                  <option value="name_asc">Nome A–Z</option>
                  <option value="name_desc">Nome Z–A</option>
                  <option value="role_asc">Perfil A–Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-white shadow-panel">
          {pageItems.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Nenhum usuário encontrado"
                text="Cadastre o primeiro funcionário para acessar o painel."
                action={
                  canWrite ? (
                    <Button type="button" onClick={openCreate}>
                      <Plus />
                      Cadastrar usuário
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-border bg-paper text-[11px] tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Usuário</th>
                      <th className="hidden px-3 py-2.5 font-semibold lg:table-cell">E-mail</th>
                      <th className="hidden px-3 py-2.5 font-semibold xl:table-cell">Telefone</th>
                      <th className="px-3 py-2.5 font-semibold">Perfil</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="w-0 whitespace-nowrap px-3 py-2.5 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((user) => (
                      <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-paper/70">
                        <td className="px-3 py-2.5 align-middle">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <UserAvatar name={user.fullName || user.email || 'U'} photoUrl={user.photoUrl} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-navy">{user.fullName || 'Sem nome'}</p>
                              <p className="truncate text-[12px] text-muted lg:hidden">{user.email || '—'}</p>
                              <p className="hidden truncate text-[12px] text-muted lg:block">{user.roleName ?? 'Sem perfil'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden max-w-[220px] truncate px-3 py-2.5 align-middle text-navy lg:table-cell">
                          {user.email || '—'}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 align-middle text-navy xl:table-cell">
                          {user.phone || '—'}
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <span className="inline-flex rounded-lg border border-border bg-paper px-2 py-1 text-[12px] font-semibold text-navy">
                            {user.roleName ?? 'Sem perfil'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <StatusBadge active={user.isActive} />
                        </td>
                        <td className="w-0 whitespace-nowrap px-3 py-2.5 align-middle">
                          <UserActions
                            canWrite={canWrite}
                            onEdit={() => openEdit(user)}
                            onDelete={() => setDeleteTarget(user)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 md:hidden">
                {pageItems.map((user) => (
                  <article key={user.id} className="rounded-[12px] border border-border bg-white p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar name={user.fullName || user.email || 'U'} photoUrl={user.photoUrl} />
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-navy">{user.fullName || 'Sem nome'}</h3>
                          <p className="truncate text-[12px] text-muted">{user.email || '—'}</p>
                          <p className="mt-1 text-[12px] text-muted">{user.roleName ?? 'Sem perfil'}</p>
                          {user.phone ? <p className="mt-0.5 text-[12px] text-muted">{user.phone}</p> : null}
                        </div>
                      </div>
                      <StatusBadge active={user.isActive} />
                    </div>
                    <div className="mt-3">
                      <UserActions
                        canWrite={canWrite}
                        onEdit={() => openEdit(user)}
                        onDelete={() => setDeleteTarget(user)}
                      />
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-muted">
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filtered.length)} de{' '}
                  {filtered.length} registros
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-navy px-2 text-sm font-semibold text-white">
                    {currentPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy">{editing ? 'Editar usuário' : 'Cadastrar usuário'}</DialogTitle>
            <DialogDescription>
              Defina o perfil de acesso com os mesmos papéis do painel Sermontiny.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-[14px] border border-border bg-paper px-4 py-5 sm:flex-row sm:items-center">
              <div className="relative">
                {photoPreview && !removePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Prévia da foto"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <UserAvatar name={fullName || email || 'U'} size="lg" />
                )}
                <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-navy shadow-sm transition hover:bg-navy hover:text-white">
                  <Camera className="h-3.5 w-3.5" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => onPhotoChange(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-semibold text-navy">Foto do funcionário</p>
                <p className="mt-0.5 text-[12px] text-muted">JPG, PNG ou WebP · comprimida automaticamente</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-semibold text-navy transition hover:bg-paper">
                    Escolher foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => onPhotoChange(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  {(photoFile || (!removePhoto && (photoPreview || editing?.photoPath))) && (
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-muted underline-offset-2 hover:text-navy hover:underline"
                      onClick={() => {
                        setPhotoFile(null);
                        setRemovePhoto(true);
                        setPhotoPreview(null);
                      }}
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-navy">Nome completo</span>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-navy">Telefone</span>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-navy">E-mail de login</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={Boolean(editing)}
                  required={!editing}
                />
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-navy">{editing ? 'Nova senha (opcional)' : 'Senha'}</span>
                <Input
                  type="password"
                  name={editing ? 'new_user_password' : 'password'}
                  autoComplete={editing ? 'new-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required={!editing}
                  minLength={editing ? undefined : 8}
                  placeholder={editing ? 'Deixe em branco para manter a senha atual' : undefined}
                />
                {editing ? (
                  <p className="text-[12px] text-muted">Só preencha se quiser trocar a senha (mínimo 8 caracteres).</p>
                ) : null}
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-navy">Perfil / função</p>
              <RadioCards value={roleId} onChange={setRoleId} options={roleCards} columns={2} />
            </div>

            {editing ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-navy">Situação</p>
                <RadioCards
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(value) => setIsActive(value === 'active')}
                  options={[
                    { value: 'active', label: 'Ativo', description: 'Pode entrar no painel.' },
                    { value: 'inactive', label: 'Inativo', description: 'Bloqueia o acesso.' },
                  ]}
                />
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="button" onClick={submit} disabled={pending}>
                {pending ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir <span className="font-semibold text-navy">{deleteTarget?.fullName}</span>? O acesso sai da
              lista do painel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingDelete}
              className="bg-danger hover:bg-[#8f1c14]"
              onClick={(event) => {
                event.preventDefault();
                runDelete();
              }}
            >
              {pendingDelete ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
        active ? 'bg-success-soft text-success' : 'bg-[#F4E8E7] text-[#8F1C14]',
      )}
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function UserActions({
  canWrite,
  onEdit,
  onDelete,
}: {
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!canWrite) {
    return <span className="text-[12px] text-muted">Somente leitura</span>;
  }

  return (
    <div className="inline-flex flex-nowrap items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent bg-navy text-white transition hover:bg-navy-secondary"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-danger transition hover:border-danger/30 hover:bg-[#FDF2F1]"
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl border-border bg-white text-navy hover:bg-paper"
            aria-label="Mais ações"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-danger focus:text-danger" onSelect={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
  tone: string;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-navy">{value}</p>
          <p className="mt-1 text-[12px] text-muted">{hint}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
