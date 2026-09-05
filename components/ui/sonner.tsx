'use client';

import { Toaster as Sonner } from 'sonner';

function Toaster() {
  return (
    <Sonner
      theme="light"
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'border-border bg-white text-navy',
        },
      }}
    />
  );
}

export { Toaster };
