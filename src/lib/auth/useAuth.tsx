"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { buildSiwsMessage, SIWS_DOMAIN } from "./message";

export type AuthUser = {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, disconnect, connected } = useWallet();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing session on mount.
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setError("Connect a wallet that can sign messages.");
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      const wallet = publicKey.toBase58();
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet }),
      }).then((r) => r.json());
      if (!nonceRes.nonce) throw new Error("Could not start sign-in.");

      const message = buildSiwsMessage({
        domain: SIWS_DOMAIN,
        address: wallet,
        nonce: nonceRes.nonce,
        issuedAt: nonceRes.issuedAt,
      });
      const signature = await signMessage(new TextEncoder().encode(message));

      const verify = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallet,
          signature: bs58.encode(signature),
          nonce: nonceRes.nonce,
        }),
      }).then((r) => r.json());

      if (verify.error) throw new Error(verify.error.message);
      setUser(verify.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in did not complete.");
    } finally {
      setSigningIn(false);
    }
  }, [publicKey, signMessage]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    try {
      await disconnect();
    } catch {
      // ignore
    }
  }, [disconnect]);

  // If the wallet is connected but there is no session yet, offer sign-in
  // automatically once, so the flow feels like one step.
  useEffect(() => {
    if (connected && publicKey && !user && !loading && !signingIn) {
      void signIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, user, loading]);

  return (
    <Ctx.Provider
      value={{ user, loading, signingIn, error, signIn, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
