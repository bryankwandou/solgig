"use client";

import { SolanaWalletProvider } from "./WalletProvider";
import { AuthProvider } from "@/lib/auth/useAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaWalletProvider>
      <AuthProvider>{children}</AuthProvider>
    </SolanaWalletProvider>
  );
}
