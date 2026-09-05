import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getCompanySettings } from '@/lib/data/company';
import { PageHeader } from '@/components/admin/page-header';
import { SettingsTabs } from '@/components/admin/settings-tabs';
import { FormField, FormSection } from '@/components/admin/form-section';
import { FormActions } from '@/components/admin/form-actions';
import { ContentCard } from '@/components/admin/content-card';
import { saveCompanySettings, updateUserRole } from '@/app/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requirePermission('settings.read');
  const settings = await getCompanySettings();
  const supabase = await createClient();
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, is_active, role_id').is('deleted_at', null),
    supabase.from('roles').select('id, name, slug').order('name'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Empresa, usuários, documentos e integrações do painel."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Configurações' }]}
      />
      <form
        action={async (formData) => {
          'use server';
          await saveCompanySettings(formData);
        }}
      >
        <SettingsTabs
          company={
            <div className="space-y-4">
              <FormSection title="Dados da empresa" description="Informações usadas em documentos e no site.">
                <FormField label="Razão social">
                  <Input name="legal_name" defaultValue={settings.legal_name} />
                </FormField>
                <FormField label="Nome fantasia">
                  <Input name="trade_name" defaultValue={settings.trade_name} />
                </FormField>
                <FormField label="CNPJ">
                  <Input name="cnpj" defaultValue={settings.cnpj} />
                </FormField>
                <FormField label="Inscrição estadual">
                  <Input name="state_registration" defaultValue={settings.state_registration ?? ''} />
                </FormField>
                <FormField label="E-mail">
                  <Input name="email" defaultValue={settings.email ?? ''} />
                </FormField>
                <FormField label="WhatsApp">
                  <Input name="whatsapp" defaultValue={settings.whatsapp ?? ''} />
                </FormField>
                <FormField label="Site">
                  <Input name="website" defaultValue={settings.website ?? ''} />
                </FormField>
                <FormField label="Telefones (um por linha)">
                  <Textarea name="phones_text" defaultValue={settings.phones.join('\n')} />
                </FormField>
              </FormSection>
              <FormSection title="Endereço">
                <FormField label="Endereço">
                  <Input name="street" defaultValue={settings.street ?? ''} />
                </FormField>
                <FormField label="Número">
                  <Input name="number" defaultValue={settings.number ?? ''} />
                </FormField>
                <FormField label="Bairro">
                  <Input name="district" defaultValue={settings.district ?? ''} />
                </FormField>
                <FormField label="Cidade">
                  <Input name="city" defaultValue={settings.city ?? ''} />
                </FormField>
                <FormField label="Estado">
                  <Input name="state" defaultValue={settings.state ?? ''} />
                </FormField>
                <FormField label="CEP">
                  <Input name="zip" defaultValue={settings.zip ?? ''} />
                </FormField>
              </FormSection>
              <FormSection title="Dados bancários">
                <FormField label="Banco">
                  <Input name="bank_name" defaultValue={settings.bank_name ?? ''} />
                </FormField>
                <FormField label="Agência">
                  <Input name="bank_agency" defaultValue={settings.bank_agency ?? ''} />
                </FormField>
                <FormField label="Conta">
                  <Input name="bank_account" defaultValue={settings.bank_account ?? ''} />
                </FormField>
                <FormField label="Chave Pix">
                  <Input name="pix_key" defaultValue={settings.pix_key ?? ''} />
                </FormField>
              </FormSection>
            </div>
          }
          users={
            user.permissions.includes('users.write') ? (
              <ContentCard title="Usuários e permissões">
                <p className="mb-4 text-[13px] text-muted">
                  As alterações de perfil são salvas individualmente e não fazem parte do formulário da empresa.
                </p>
                <div className="space-y-3">
                  {(profiles ?? []).map((profile) => (
                    <div key={profile.id} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-4 md:items-center">
                      <p className="text-sm font-medium text-navy">{profile.full_name}</p>
                      <p className="text-[13px] text-muted md:col-span-3">Use o botão Atualizar ao lado para gravar o perfil.</p>
                    </div>
                  ))}
                </div>
              </ContentCard>
            ) : (
              <ContentCard title="Usuários e permissões">
                <p className="text-sm text-muted">O seu perfil não pode alterar usuários.</p>
              </ContentCard>
            )
          }
          documents={
            <FormSection title="Documentos e PDFs">
              <FormField label="Logo" className="md:col-span-2">
                <Input type="file" name="logo" accept="image/*" />
              </FormField>
              <FormField label="Condições comerciais padrão" className="md:col-span-2">
                <Textarea name="default_commercial_terms" defaultValue={settings.default_commercial_terms ?? ''} />
              </FormField>
              <FormField label="Condições de pagamento padrão" className="md:col-span-2">
                <Textarea name="default_payment_terms" defaultValue={settings.default_payment_terms ?? ''} />
              </FormField>
            </FormSection>
          }
          whatsapp={
            <FormSection title="WhatsApp" description="Tokens da API oficial ficam apenas no servidor e não são exibidos aqui.">
              <FormField label="Provedor">
                <select name="whatsapp_provider" defaultValue={settings.whatsapp_provider} className={ADMIN_SELECT_CLASS}>
                  <option value="wa_me">Modo simples (wa.me)</option>
                  <option value="cloud_api">API oficial (servidor)</option>
                </select>
              </FormField>
              <FormField label="Modelo WhatsApp orçamento" className="md:col-span-2">
                <Textarea name="quote_whatsapp_template" defaultValue={settings.quote_whatsapp_template} />
              </FormField>
              <FormField label="Modelo WhatsApp contrato" className="md:col-span-2">
                <Textarea name="contract_whatsapp_template" defaultValue={settings.contract_whatsapp_template} />
              </FormField>
              <p className="text-[13px] text-muted md:col-span-2">
                A API oficial usa somente variáveis de ambiente do servidor. Nenhum token completo é exibido no navegador.
              </p>
            </FormSection>
          }
          numbering={
            <FormSection title="Numeração">
              <FormField label="Prefixo orçamento">
                <Input name="quote_prefix" defaultValue={settings.quote_prefix} />
              </FormField>
              <FormField label="Prefixo contrato">
                <Input name="contract_prefix" defaultValue={settings.contract_prefix} />
              </FormField>
            </FormSection>
          }
          appearance={
            <FormSection title="Aparência do site público">
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" name="show_public_prices" defaultChecked={settings.show_public_prices} />
                Exibir preços no site público
              </label>
            </FormSection>
          }
          security={
            <ContentCard title="Segurança" description="Recuperação de senha e boas práticas de acesso.">
              <p className="text-sm text-muted">
                Use a tela de recuperação de senha para redefinir o acesso. Tokens, chaves e senhas nunca são exibidos
                neste painel.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <a href="/admin/recuperar-senha">Abrir recuperação de senha</a>
              </Button>
            </ContentCard>
          }
        />
        <FormActions className="mt-4">
          <Button type="submit">Salvar configurações</Button>
        </FormActions>
      </form>

      {user.permissions.includes('users.write') && (
        <ContentCard title="Atualizar usuários">
          <div className="space-y-3">
            {(profiles ?? []).map((profile) => (
              <form
                key={profile.id}
                action={async (formData) => {
                  'use server';
                  await updateUserRole(formData);
                }}
                className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-4 md:items-center"
              >
                <input type="hidden" name="profile_id" value={profile.id} />
                <p className="text-sm font-medium text-navy">{profile.full_name}</p>
                <select name="role_id" defaultValue={profile.role_id ?? ''} className={ADMIN_SELECT_CLASS}>
                  {(roles ?? []).map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_active" defaultChecked={profile.is_active} />
                  Ativo
                </label>
                <Button type="submit" variant="outline">
                  Atualizar
                </Button>
              </form>
            ))}
          </div>
        </ContentCard>
      )}
    </div>
  );
}
