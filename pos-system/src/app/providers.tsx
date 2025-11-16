"use client";

import { PosProvider } from "@/store/pos-store";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <PosProvider>{children}</PosProvider>;
};

