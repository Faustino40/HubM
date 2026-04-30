import { DriverRankingTable } from "./DriverRankingTable";
import type { Driver } from "../types";

interface LandingPageProps {
  onEntrar: (mode: "operador" | "admin") => void;
  drivers: Driver[];
}

export function LandingPage({ onEntrar, drivers }: LandingPageProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <img
        src="https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&w=1800&q=80"
        alt="Caminhao em rota de entrega"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/70 to-slate-950" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-bold tracking-tight text-[#FF6200]">Hubmotoristas.com.br</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Match inteligente entre transportadora e motorista para liberar frete com velocidade operacional.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-200 sm:text-base">
            Logtech nacional inspirada no modelo Freto para cadastro de carga, valor de frete, local de entrega e contratacao em poucos cliques.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onEntrar("operador")}
              className="rounded-md bg-[#000B40] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3B85FA]"
            >
              Entrar na Plataforma
            </button>
            <button
              onClick={() => onEntrar("admin")}
              className="rounded-md border border-blue-300/70 bg-[#000B40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3B85FA]"
            >
              Entrar como Administrador
            </button>
            <a href="#resultados-ranking" className="rounded-md border border-slate-300/40 px-5 py-3 text-sm font-semibold text-white">
              Ver resultados
            </a>
          </div>
        </div>

        <div id="social-proof" className="grid gap-6 border-t border-white/20 pt-8 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-bold text-[#FF6200]">+2,5 milhoes</p>
            <p className="text-sm text-slate-200">de cargas conectadas digitalmente</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#FF6200]">+R$ 13 bi</p>
            <p className="text-sm text-slate-200">em fretes negociados na rede</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#FF6200]">+1 bilhao km</p>
            <p className="text-sm text-slate-200">rodados com rastreabilidade operacional</p>
          </div>
        </div>

        <div id="resultados-ranking" className="mt-8 border-t border-white/20 pt-6">
          <p className="text-lg font-semibold text-white">Ranking de motoristas cadastrados</p>
          <p className="mt-1 text-sm text-slate-200">Indicadores de performance e seguranca para apoiar a selecao da transportadora.</p>
          <div className="mt-3">
            <DriverRankingTable drivers={drivers} />
          </div>
        </div>
      </div>
    </section>
  );
}