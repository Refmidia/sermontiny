'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SettingsTabs({
  company,
  users,
  documents,
  whatsapp,
  numbering,
  appearance,
  security,
}: {
  company: React.ReactNode;
  users: React.ReactNode;
  documents: React.ReactNode;
  whatsapp: React.ReactNode;
  numbering: React.ReactNode;
  appearance: React.ReactNode;
  security: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="empresa" className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-paper-strong p-1">
        <TabsTrigger value="empresa">Empresa</TabsTrigger>
        <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        <TabsTrigger value="documentos">Documentos e PDFs</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="numeracao">Numeração</TabsTrigger>
        <TabsTrigger value="aparencia">Aparência</TabsTrigger>
        <TabsTrigger value="seguranca">Segurança</TabsTrigger>
      </TabsList>
      <TabsContent forceMount value="empresa" className="data-[state=inactive]:hidden">
        {company}
      </TabsContent>
      <TabsContent forceMount value="usuarios" className="data-[state=inactive]:hidden">
        {users}
      </TabsContent>
      <TabsContent forceMount value="documentos" className="data-[state=inactive]:hidden">
        {documents}
      </TabsContent>
      <TabsContent forceMount value="whatsapp" className="data-[state=inactive]:hidden">
        {whatsapp}
      </TabsContent>
      <TabsContent forceMount value="numeracao" className="data-[state=inactive]:hidden">
        {numbering}
      </TabsContent>
      <TabsContent forceMount value="aparencia" className="data-[state=inactive]:hidden">
        {appearance}
      </TabsContent>
      <TabsContent forceMount value="seguranca" className="data-[state=inactive]:hidden">
        {security}
      </TabsContent>
    </Tabs>
  );
}
