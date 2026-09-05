import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatBRL } from '@/lib/money';
import { formatDateBr } from '@/lib/format';
import type { CompanySettings, QuoteItem } from '@/types/database';
import { UNIT_LABELS } from '@/types/database';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: '#1a1d21', fontFamily: 'Helvetica' },
  header: { borderBottomWidth: 2, borderBottomColor: '#c4a35a', paddingBottom: 10, marginBottom: 14 },
  brand: { fontSize: 16, color: '#0a1f3d', fontFamily: 'Helvetica-Bold' },
  muted: { color: '#5c6570', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  box: { borderWidth: 1, borderColor: '#d5dbe3', padding: 8, marginBottom: 10 },
  title: { fontSize: 14, color: '#0a1f3d', fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0a1f3d', color: '#fff', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#d5dbe3', padding: 6 },
  colDesc: { width: '42%' },
  colUnit: { width: '14%' },
  colQty: { width: '12%' },
  colValue: { width: '16%', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, fontSize: 8, color: '#5c6570' },
  sign: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { width: '45%', borderTopWidth: 1, borderTopColor: '#1a1d21', paddingTop: 6, textAlign: 'center' },
});

type QuotePdfProps = {
  settings: CompanySettings;
  number: string;
  version: number;
  issuedAt: string;
  validUntil?: string | null;
  customerName: string;
  customerDocument: string;
  unitName?: string | null;
  title: string;
  scope?: string | null;
  notes?: string | null;
  paymentTerms?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  items: Array<Pick<QuoteItem, 'description' | 'unit' | 'quantity' | 'unit_price_cents' | 'subtotal_cents'>>;
  totalCents: number;
  totalExtenso: string;
};

export function QuotePdf(props: QuotePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{props.settings.trade_name}</Text>
          <Text style={styles.muted}>
            {props.settings.legal_name} · CNPJ {props.settings.cnpj}
          </Text>
          <Text style={styles.muted}>
            {props.settings.street}, {props.settings.number} - {props.settings.district} - {props.settings.city}/
            {props.settings.state}
          </Text>
        </View>
        <View style={styles.row}>
          <View>
            <Text style={styles.title}>Orçamento {props.number} · V{props.version}</Text>
            <Text>Emissão: {formatDateBr(props.issuedAt)}</Text>
            {props.validUntil && <Text>Validade: {formatDateBr(props.validUntil)}</Text>}
          </View>
          <View>
            <Text>Cliente: {props.customerName}</Text>
            <Text>Documento: {props.customerDocument}</Text>
            {props.unitName && <Text>Unidade: {props.unitName}</Text>}
          </View>
        </View>
        <View style={styles.box}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{props.title}</Text>
          {props.scope && <Text style={{ marginTop: 6 }}>{props.scope}</Text>}
          {(props.startDate || props.endDate) && (
            <Text style={{ marginTop: 6 }}>
              Período: {props.startDate ? formatDateBr(props.startDate) : 'a definir'} a{' '}
              {props.endDate ? formatDateBr(props.endDate) : 'a definir'}
            </Text>
          )}
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descrição</Text>
          <Text style={styles.colUnit}>Unidade</Text>
          <Text style={styles.colQty}>Qtde</Text>
          <Text style={styles.colValue}>Unitário</Text>
          <Text style={styles.colValue}>Subtotal</Text>
        </View>
        {props.items.map((item, index) => (
          <View key={`${item.description}-${index}`} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colUnit}>{UNIT_LABELS[item.unit]}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colValue}>{formatBRL(item.unit_price_cents)}</Text>
            <Text style={styles.colValue}>{formatBRL(item.subtotal_cents)}</Text>
          </View>
        ))}
        <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12 }}>Total: {formatBRL(props.totalCents)}</Text>
          <Text>{props.totalExtenso}</Text>
        </View>
        {props.paymentTerms && (
          <View style={[styles.box, { marginTop: 12 }]}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Condições</Text>
            <Text>{props.paymentTerms}</Text>
          </View>
        )}
        {props.notes && (
          <View style={styles.box}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Observações</Text>
            <Text>{props.notes}</Text>
          </View>
        )}
        <View style={styles.sign}>
          <Text style={styles.signBox}>Sermontiny</Text>
          <Text style={styles.signBox}>Aceite do cliente</Text>
        </View>
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${props.settings.email ?? ''} · ${props.settings.website ?? ''} · Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

type ContractPdfProps = {
  settings: CompanySettings;
  number: string;
  version: number;
  customerName: string;
  customerDocument: string;
  object: string;
  scope?: string | null;
  totalCents: number;
  startsOn?: string | null;
  endsOn?: string | null;
  payment?: string | null;
  responsibilities: Array<{ label: string; value: string }>;
  clauses: Array<{ title: string; body: string }>;
};

export function ContractPdf(props: ContractPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Contrato {props.number}</Text>
          <Text style={styles.muted}>Versão {props.version} · {props.settings.legal_name}</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.title}>Identificação das partes</Text>
          <Text>CONTRATADA: {props.settings.legal_name}, CNPJ {props.settings.cnpj}.</Text>
          <Text>CONTRATANTE: {props.customerName}, documento {props.customerDocument}.</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.title}>Objeto</Text>
          <Text>{props.object}</Text>
          {props.scope && <Text style={{ marginTop: 6 }}>{props.scope}</Text>}
        </View>
        <View style={styles.box}>
          <Text style={styles.title}>Valores e vigência</Text>
          <Text>Valor: {formatBRL(props.totalCents)}</Text>
          <Text>
            Vigência: {props.startsOn ? formatDateBr(props.startsOn) : 'a definir'} a{' '}
            {props.endsOn ? formatDateBr(props.endsOn) : 'a definir'}
          </Text>
          {props.payment && <Text>Pagamento: {props.payment}</Text>}
        </View>
        <View style={styles.box}>
          <Text style={styles.title}>Responsabilidades</Text>
          {props.responsibilities.map((item) => (
            <Text key={item.label}>
              {item.label}: {item.value}
            </Text>
          ))}
        </View>
        {props.clauses.map((clause) => (
          <View key={clause.title} style={styles.box} wrap={false}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{clause.title}</Text>
            <Text style={{ marginTop: 4 }}>{clause.body}</Text>
          </View>
        ))}
        <View style={styles.sign}>
          <Text style={styles.signBox}>Contratada</Text>
          <Text style={styles.signBox}>Contratante</Text>
        </View>
        <View style={[styles.sign, { marginTop: 36 }]}>
          <Text style={styles.signBox}>Testemunha 1</Text>
          <Text style={styles.signBox}>Testemunha 2</Text>
        </View>
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${props.settings.legal_name} · ${props.settings.cnpj} · Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
