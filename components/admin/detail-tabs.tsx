'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DetailTabs({
  items,
}: {
  items: Array<{ value: string; label: string; content: React.ReactNode }>;
}) {
  return (
    <Tabs defaultValue={items[0]?.value} className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-paper-strong p-1">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
