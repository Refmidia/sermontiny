import Link from 'next/link';
import { requirePermission } from '@/lib/auth/session';
import { getCompanySettings } from '@/lib/data/company';
import { PageHeader } from '@/components/admin/page-header';
import { SettingsTabs } from '@/components/admin/settings-tabs';
import { FormField, FormSection } from '@/components/admin/form-section';
import { ContentCard } from '@/components/admin/content-card';
import { PageActionBar } from '@/components/admin/page-action-bar';
import { SettingsForm } from '@/components/admin/settings-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requirePermission('settings.read');
  const settings = await getCompanySettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Empresa, documentos e integrações do painel."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Configurações' }]}
        actions={
          user.permissions.includes('users.read') ? (
            <PageActionBar
              actions={[{ label: 'Usuários e funcionários', href: '/admin/usuarios', icon: 'user-cog', variant: 'gold' }]}
            />
          ) : null
        }
      />
      <SettingsForm>
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
                <FormField
                  label="Chave Pix"
                  hint="Gera o QR Code Pix da proposta já com o valor do orçamento. Se ficar vazia, usa o CNPJ da empresa."
                >
                  <Input name="pix_key" defaultValue={settings.pix_key ?? ''} />
                </FormField>
              </FormSection>
            </div>
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
              {user.permissions.includes('users.read') ? (
                <Button asChild variant="gold" className="mt-4 ml-2">
                  <Link href="/admin/usuarios">Gerenciar usuários</Link>
                </Button>
              ) : null}
            </ContentCard>
          }
        />
      </SettingsForm>
    </div>
  );
}
