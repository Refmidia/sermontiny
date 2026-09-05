import { createAdminClient } from '@/lib/supabase/admin';
import type { WhatsAppProvider } from '@/types/database';

export type WhatsAppSendInput = {
  to: string;
  body: string;
  documentPath?: string;
  fileName?: string;
  quoteId?: string;
  contractId?: string;
  documentId?: string;
  actorId?: string;
  provider: WhatsAppProvider;
};

export type WhatsAppSendResult = {
  status: 'sent' | 'failed';
  waLink?: string;
  providerMessageId?: string;
  error?: string;
};

function applyTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
}

export { applyTemplate };

export async function sendWhatsApp(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const supabase = createAdminClient();

  if (input.provider === 'wa_me') {
    const link = `https://wa.me/${input.to.replace(/\D/g, '')}?text=${encodeURIComponent(input.body)}`;
    const { data } = await supabase
      .from('whatsapp_messages')
      .insert({
        provider: 'wa_me',
        to_number: input.to,
        body: input.body,
        document_id: input.documentId ?? null,
        quote_id: input.quoteId ?? null,
        contract_id: input.contractId ?? null,
        status: 'sent',
        created_by: input.actorId ?? null,
      })
      .select('id')
      .single();
    return { status: 'sent', waLink: link, providerMessageId: data?.id };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    await supabase.from('whatsapp_messages').insert({
      provider: 'cloud_api',
      to_number: input.to,
      body: input.body,
      document_id: input.documentId ?? null,
      quote_id: input.quoteId ?? null,
      contract_id: input.contractId ?? null,
      status: 'failed',
      error_message: 'Credenciais da API oficial não configuradas.',
      created_by: input.actorId ?? null,
    });
    return {
      status: 'failed',
      error: 'Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID no servidor.',
    };
  }

  try {
    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: input.to.replace(/\D/g, ''),
      type: input.documentPath ? 'document' : 'text',
    };

    if (input.documentPath) {
      const { data: signed } = await supabase.storage
        .from('documents')
        .createSignedUrl(input.documentPath, 60 * 10);
      payload.document = {
        link: signed?.signedUrl,
        filename: input.fileName ?? 'documento.pdf',
        caption: input.body,
      };
    } else {
      payload.text = { body: input.body };
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = (await response.json()) as { messages?: Array<{ id: string }>; error?: { message: string } };
    if (!response.ok) {
      throw new Error(json.error?.message || 'Falha na API do WhatsApp.');
    }
    const messageId = json.messages?.[0]?.id;
    await supabase.from('whatsapp_messages').insert({
      provider: 'cloud_api',
      to_number: input.to,
      body: input.body,
      document_id: input.documentId ?? null,
      quote_id: input.quoteId ?? null,
      contract_id: input.contractId ?? null,
      status: 'sent',
      provider_message_id: messageId,
      created_by: input.actorId ?? null,
    });
    return { status: 'sent', providerMessageId: messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha no envio.';
    await supabase.from('whatsapp_messages').insert({
      provider: 'cloud_api',
      to_number: input.to,
      body: input.body,
      document_id: input.documentId ?? null,
      quote_id: input.quoteId ?? null,
      contract_id: input.contractId ?? null,
      status: 'failed',
      error_message: message,
      created_by: input.actorId ?? null,
    });
    return { status: 'failed', error: message };
  }
}
