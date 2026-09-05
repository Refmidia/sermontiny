import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-navy text-white hover:bg-navy-secondary',
        gold: 'bg-gold text-navy hover:bg-gold-bright',
        outline: 'border border-border bg-white text-navy hover:bg-paper-strong',
        ghost: 'hover:bg-paper-strong text-navy',
        link: 'text-steel underline-offset-4 hover:underline',
        destructive: 'bg-danger text-white hover:bg-[#8f1c14]',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-10 px-3',
        lg: 'h-11 px-6',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
