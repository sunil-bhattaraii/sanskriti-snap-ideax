"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TokenPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    getToken().then(setToken);
  }, [isSignedIn, getToken]);

  async function refresh() {
    const t = await getToken({ skipCache: true });
    setToken(t);
    setCopied(false);
  }

  async function copy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isLoaded) {
    return <p className="p-8 text-zinc-500">Loading…</p>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">You are not signed in.</p>
          <Link
            href="/sign-in"
            className="inline-block rounded-full bg-black px-6 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Session token</h1>
        <p className="text-sm text-zinc-500">
          Paste this into Scalar&apos;s <strong>Authorize</strong> dialog. Tokens expire
          after ~60 s — hit <strong>Refresh</strong> if you get a 401.
        </p>

        <textarea
          readOnly
          value={token ?? "Fetching…"}
          rows={6}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        <div className="flex gap-3">
          <button
            onClick={copy}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={refresh}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
          <a
            href="/reference"
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Open Scalar →
          </a>
        </div>
      </div>
    </div>
  );
}
