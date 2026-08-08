import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent-2)] text-[#111] shadow-[0_10px_30px_color-mix(in_srgb,var(--accent-2)_35%,transparent)] hover:brightness-110",
        accent:
          "bg-[var(--accent)] text-[#041016] shadow-[0_10px_30px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:brightness-110",
        glass:
          "glass-thin text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--glass)_80%,white_8%)]",
        ghost:
          "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--glass)_50%,transparent)]",
        danger:
          "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--danger)] border border-[color-mix(in_srgb,var(--danger)_35%,transparent)]",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
