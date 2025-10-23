export default function Connected() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 py-20 px-8 bg-white dark:bg-black">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Conta conectada!</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          A autorização com o Mercado Livre foi concluída. Em breve exibiremos os dados sincronizados.
        </p>
      </main>
    </div>
  );
}
