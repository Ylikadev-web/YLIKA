import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassProps = HTMLAttributes<HTMLDivElement> & {
  strength?: "thin" | "default" | "strong";
};

export function Glass({
  className,
  strength = "default",
  ...props
}: GlassProps) {
  return (
    <div
      className={cn(
        "rounded-3xl",
        strength === "thin" && "glass-thin",
        strength === "default" && "glass",
        strength === "strong" && "glass-strong",
        className,
      )}
      {...props}
    />
  );
}
