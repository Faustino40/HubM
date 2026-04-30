export function SupportChat() {
  return (
    <section className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-xl font-semibold text-slate-900">Suporte online 24/7</h2>
        <p className="mt-1 text-sm text-slate-600">Canal simulado para orientacao de cadastro e liberacao de viagem.</p>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-800">
            <span className="font-semibold text-[#000B40]">Hub Suporte:</span> Ola, posso te ajudar com PGR, documentos fiscais e match de cargas.
          </p>
          <p className="mt-2 text-sm text-slate-800">
            <span className="font-semibold text-[#FF6200]">Motorista:</span> Quero saber quando meu selo de verificado sera liberado.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#3B85FA] focus:ring"
              placeholder="Digite sua mensagem"
              aria-label="Mensagem para o suporte"
            />
            <button className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]">Enviar</button>
          </div>
        </div>
      </div>
    </section>
  );
}