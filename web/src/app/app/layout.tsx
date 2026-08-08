import type { ReactNode } from "react";
import { YlikaBotHost } from "@/components/bot/ylika-bot-host";

export default function AppAreaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <YlikaBotHost />
    </>
  );
}
