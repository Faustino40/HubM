import { useState } from "react"; // Adicionado para controlar o Pop-up
import { MessageCircle, X, Send } from "lucide-react"; // Ícones para o Chatbot
import { DriverRankingTable } from "./DriverRankingTable";
import type { Driver } from "../types";

interface LandingPageProps {
  onEntrar: (mode: "operador" | "admin") => void;
  drivers: Driver[];
}

export function LandingPage({ onEntrar, drivers }: LandingPageProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // Função para simular o envio da mensagem
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      console.log("Mensagem enviada para o chatbot:", chatMessage);
      setChatMessage("");
      // Aqui integraríamos a API do seu chatbot futuramente
    }
  };

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
          {/* Ajuste: O hub digital entre empresas e motoristas */}
          <p className="text-lg font-bold tracking-tight text-[#FF6200]">O hub digital entre empresas e motoristas</p>
          
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            {/* Ajuste: Match inteligente entre sua empresa e os motoristas qualificados */}
            Match inteligente entre sua empresa e os motoristas qualificados.
          </h1>
          
          <p className="mt-4 max-w-xl text-sm text-slate-200 sm:text-base">
            {/* Removida a frase sobre Logtech nacional/Freto */}
            Conectividade total para gestão de fretes, segurança e agilidade na contratação de motoristas parceiros.
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
            {/* Ajuste: Ver landing para Tela inicial */}
            <a href="/" className="rounded-md border border-slate-300/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Tela inicial
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

      {/* --- NOVO COMPONENTE: POP-UP CHATBOT --- */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6200] text-white shadow-lg transition-transform hover:scale-110"
          >
            <MessageCircle size={28} />
          </button>
        ) : (
          <div className="flex h-96 w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-5">
            {/* Header do Chat */}
            <div className="flex items-center justify-between bg-[#000B40] p-4 text-white">
              <span className="font-semibold">Suporte Hubmotoristas</span>
              <button onClick={() => setIsChatOpen(false)}><X size={20} /></button>
            </div>
            
            {/* Corpo do Chat */}
            <div className="flex-1 bg-slate-50 p-4 text-slate-800 text-sm overflow-y-auto">
              <div className="mb-2 rounded-lg bg-slate-200 p-2 self-start inline-block">
                Olá! Como podemos ajudar sua empresa hoje?
              </div>
            </div>

            {/* Input de Mensagem (Garantindo que esteja funcionando) */}
            <form onSubmit={handleSendMessage} className="border-t p-3 flex gap-2">
              <input
                type="text"
                autoFocus
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 text-sm outline-none text-slate-900"
              />
              <button type="submit" className="text-[#FF6200] hover:scale-110 transition">
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
