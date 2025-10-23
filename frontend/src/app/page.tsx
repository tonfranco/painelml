"use client";
import Image from "next/image";

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const connect = () => {
    window.location.href = `${apiBase}/meli/oauth/start`;
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-10 py-20 px-8 bg-white dark:bg-black">
        <div className="flex items-center gap-4">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={80} height={16} />
          <span className="text-xl text-zinc-700 dark:text-zinc-300">Painel ML (DEV)</span>
        </div>
        <button
          onClick={connect}
          className="rounded-full bg-black text-white px-6 py-3 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
        >
          Conectar conta Mercado Livre
        </button>
        <a
          href="/accounts"
          className="text-sm text-zinc-700 hover:underline dark:text-zinc-300"
        >
          Ver contas conectadas
        </a>
      </main>
    </div>
  );
}
