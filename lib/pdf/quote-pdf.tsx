import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { formatBRL } from '@/lib/money';
import { UNIT_LABELS } from '@/types/database';
import type { QuoteDocumentModel } from '@/lib/pdf/quote-document';

const navy = '#071B35';
const gold = '#D6A72C';
const ink = '#10233F';
const muted = '#5C6B7A';
const line = '#DDE4EC';

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingHorizontal: 36, paddingBottom: 48, fontSize: 9, color: ink, fontFamily: 'Helvetica' },
  topBar: { height: 5, backgroundColor: gold, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  logo: { width: 148, height: 44, objectFit: 'contain' },
  brandFallback: { fontSize: 16, color: navy, fontFamily: 'Helvetica-Bold' },
  companyMeta: { marginTop: 6, color: muted, lineHeight: 1.4, maxWidth: 260 },
  stamp: { width: 188, borderWidth: 1, borderColor: '#E4C56A', backgroundColor: '#FFF4CC', overflow: 'hidden' },
  stampBar: { height: 5, backgroundColor: gold },
  stampBody: { paddingVertical: 8, paddingHorizontal: 10 },
  stampBadge: {
    alignSelf: 'flex-start',
    backgroundColor: navy,
    color: gold,
    fontSize: 7,
    letterSpacing: 1.1,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  stampNumber: { marginTop: 6, fontSize: 13, color: navy, fontFamily: 'Helvetica-Bold' },
  stampMetaList: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E4C56A' },
  stampMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  stampMetaLabel: { fontSize: 7, color: muted, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  stampMetaValue: { fontSize: 8, color: navy, fontFamily: 'Helvetica-Bold' },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  card: { flex: 1, borderWidth: 1, borderColor: '#E8D7A0', backgroundColor: '#FFFCF4', padding: 10 },
  cardTitle: { fontSize: 8, letterSpacing: 1, color: gold, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  strong: { fontFamily: 'Helvetica-Bold', color: navy, fontSize: 10 },
  line: { marginTop: 2, color: muted },
  title: { fontSize: 12, color: navy, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  body: { lineHeight: 1.45, color: ink },
  tableHeader: { flexDirection: 'row', backgroundColor: navy, color: '#fff', paddingVertical: 6, paddingHorizontal: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: line, paddingVertical: 6, paddingHorizontal: 6 },
  colDesc: { width: '40%' },
  colUnit: { width: '14%' },
  colQty: { width: '10%', textAlign: 'right' },
  colValue: { width: '18%', textAlign: 'right' },
  extenso: { marginTop: 6, fontSize: 8, color: muted, fontFamily: 'Helvetica-Oblique' },
  adjustRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, color: muted },
  pixWrap: { marginTop: 14, borderWidth: 1, borderColor: '#E4C56A', backgroundColor: '#FFF4CC' },
  pixBar: { height: 5, backgroundColor: gold },
  pixCard: { padding: 12, flexDirection: 'row', gap: 14, alignItems: 'center' },
  pixCopy: { flex: 1 },
  pixHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  pixBadge: {
    backgroundColor: navy,
    color: gold,
    fontSize: 8,
    letterSpacing: 1.4,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pixTitle: { fontSize: 9, color: navy, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6 },
  pixHint: { marginTop: 4, fontSize: 8, color: muted },
  pixTotalLabel: { fontSize: 8, color: muted, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6 },
  pixTotalValue: { marginTop: 2, fontSize: 16, color: navy, fontFamily: 'Helvetica-Bold' },
  pixKeyBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E4C56A',
    backgroundColor: '#fff',
    padding: 6,
  },
  pixKeyLabel: { fontSize: 7, color: gold, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 },
  pixKeyValue: { marginTop: 2, fontSize: 10, color: navy, fontFamily: 'Helvetica-Bold' },
  pixChecks: { marginTop: 7, fontSize: 7, color: muted },
  pixQrFrame: { borderWidth: 2, borderColor: gold, backgroundColor: '#fff', padding: 4 },
  pixQr: { width: 92, height: 92, objectFit: 'contain' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  signBox: { width: '46%', borderTopWidth: 1, borderTopColor: navy, paddingTop: 6, textAlign: 'center', fontSize: 8, color: muted },
  footer: { position: 'absolute', bottom: 18, left: 36, right: 36, borderTopWidth: 1, borderTopColor: gold, paddingTop: 6, fontSize: 7, color: muted, flexDirection: 'row', justifyContent: 'space-between' },
});

function logoSrc() {
  const path = join(process.cwd(), 'public/images/sermontiny/logo-oficial-nav.png');
  return existsSync(path) ? path : null;
}

export function QuotePdf(props: QuoteDocumentModel) {
  const logo = logoSrc();
  return (
    <Document title={`${props.number} · Proposta comercial`} author={props.settings.legal_name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />
        <View style={styles.header}>
          <View>
            {logo ? <Image src={logo} style={styles.logo} /> : <Text style={styles.brandFallback}>{props.settings.trade_name}</Text>}
            <Text style={styles.companyMeta}>
              {props.settings.legal_name}
              {'\n'}
              CNPJ {props.settings.cnpj}
              {'\n'}
              {props.companyAddress}
              {props.settings.whatsapp || props.settings.phones?.[0] ? `\n${props.settings.whatsapp || props.settings.phones[0]}` : ''}
              {props.settings.email ? `\n${props.settings.email}` : ''}
            </Text>
          </View>
          <View style={styles.stamp}>
            <View style={styles.stampBar} />
            <View style={styles.stampBody}>
              <Text style={styles.stampBadge}>PROPOSTA COMERCIAL</Text>
              <Text style={styles.stampNumber}>{props.number}</Text>
              <View style={styles.stampMetaList}>
                <View style={styles.stampMetaRow}>
                  <Text style={styles.stampMetaLabel}>VERSÃO</Text>
                  <Text style={styles.stampMetaValue}>{props.version}</Text>
                </View>
                <View style={styles.stampMetaRow}>
                  <Text style={styles.stampMetaLabel}>EMISSÃO</Text>
                  <Text style={styles.stampMetaValue}>{props.issuedAt}</Text>
                </View>
                {props.validUntil ? (
                  <View style={styles.stampMetaRow}>
                    <Text style={styles.stampMetaLabel}>VALIDADE</Text>
                    <Text style={styles.stampMetaValue}>{props.validUntil}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>CLIENTE</Text>
            <Text style={styles.strong}>{props.customerName}</Text>
            {props.customerTradeName ? <Text style={styles.line}>{props.customerTradeName}</Text> : null}
            <Text style={styles.line}>{props.customerDocumentLabel}</Text>
            {props.customerAddress ? <Text style={styles.line}>{props.customerAddress}</Text> : null}
            {props.unitName ? <Text style={styles.line}>Unidade: {props.unitName}</Text> : null}
            {props.customerEmail ? <Text style={styles.line}>{props.customerEmail}</Text> : null}
            {props.customerPhone ? <Text style={styles.line}>{props.customerPhone}</Text> : null}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>SERVIÇO</Text>
            <Text style={styles.strong}>{props.title}</Text>
            {(props.startDate || props.endDate) ? (
              <Text style={styles.line}>
                Período: {props.startDate ?? 'a definir'} a {props.endDate ?? 'a definir'}
              </Text>
            ) : null}
            {props.paymentDeadline ? <Text style={styles.line}>Prazo de pagamento: {props.paymentDeadline}</Text> : null}
          </View>
        </View>

        {props.scope ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.title}>Escopo</Text>
            <Text style={styles.body}>{props.scope}</Text>
          </View>
        ) : null}

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descrição</Text>
          <Text style={styles.colUnit}>Unidade</Text>
          <Text style={styles.colQty}>Qtde</Text>
          <Text style={styles.colValue}>Unitário</Text>
          <Text style={styles.colValue}>Subtotal</Text>
        </View>
        {props.items.map((item, index) => (
          <View key={`${item.description}-${index}`} style={styles.tableRow} wrap={false}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colUnit}>{UNIT_LABELS[item.unit]}</Text>
            <Text style={styles.colQty}>{String(item.quantity).replace('.', ',')}</Text>
            <Text style={styles.colValue}>{formatBRL(item.unit_price_cents)}</Text>
            <Text style={styles.colValue}>{formatBRL(item.subtotal_cents)}</Text>
          </View>
        ))}

        {(props.discountCents > 0 || props.surchargeCents > 0 || props.taxCents > 0) ? (
          <View style={{ marginTop: 10, alignSelf: 'flex-end', width: 220 }}>
            <View style={styles.adjustRow}>
              <Text>Subtotal</Text>
              <Text>{formatBRL(props.subtotalCents)}</Text>
            </View>
            {props.discountCents > 0 ? (
              <View style={styles.adjustRow}>
                <Text>Desconto</Text>
                <Text>- {formatBRL(props.discountCents)}</Text>
              </View>
            ) : null}
            {props.surchargeCents > 0 ? (
              <View style={styles.adjustRow}>
                <Text>Acréscimo</Text>
                <Text>{formatBRL(props.surchargeCents)}</Text>
              </View>
            ) : null}
            {props.taxCents > 0 ? (
              <View style={styles.adjustRow}>
                <Text>Impostos</Text>
                <Text>{formatBRL(props.taxCents)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {props.pixQrSrc ? (
          <View style={styles.pixWrap} wrap={false}>
            <View style={styles.pixBar} />
            <View style={styles.pixCard}>
              <View style={styles.pixCopy}>
                <View style={styles.pixHead}>
                  <Text style={styles.pixBadge}>PIX</Text>
                  <Text style={styles.pixTitle}>PAGAMENTO VIA PIX</Text>
                </View>
                <Text style={styles.pixTotalLabel}>TOTAL À VISTA</Text>
                <Text style={styles.pixTotalValue}>{formatBRL(props.totalCents)}</Text>
                <Text style={styles.extenso}>{props.totalExtenso}</Text>
                {props.pixKeyLabel ? (
                  <View style={styles.pixKeyBox}>
                    <Text style={styles.pixKeyLabel}>CHAVE PIX · CNPJ</Text>
                    <Text style={styles.pixKeyValue}>{props.pixKeyLabel}</Text>
                  </View>
                ) : null}
                <Text style={styles.pixHint}>Escaneie o QR Code no aplicativo do seu banco.</Text>
                <Text style={styles.pixChecks}>Pagamento instantâneo  ·  Guarde o comprovante</Text>
              </View>
              <View style={styles.pixQrFrame}>
                <Image src={props.pixQrSrc} style={styles.pixQr} />
              </View>
            </View>
          </View>
        ) : null}

        {props.paymentTerms ? (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.title}>Condições comerciais</Text>
            <Text style={styles.body}>{props.paymentTerms}</Text>
          </View>
        ) : null}
        {props.notes ? (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.title}>Observações</Text>
            <Text style={styles.body}>{props.notes}</Text>
          </View>
        ) : null}

        <View style={styles.signRow}>
          <Text style={styles.signBox}>{props.settings.legal_name}{'\n'}Contratada</Text>
          <Text style={styles.signBox}>{props.customerName}{'\n'}Aceite do cliente</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            {props.settings.website ?? ''} {props.settings.email ? ` · ${props.settings.email}` : ''}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
