import { useEffect, useMemo, useState } from "react";
import { DriverMatchBoard } from "./components/DriverMatchBoard";
import { LandingPage } from "./components/LandingPage";
import { PlatformAccess } from "./components/PlatformAccess";
import { ShipperBIDashboard } from "./components/ShipperBIDashboard";
import { SupportChat } from "./components/SupportChat";
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";
import { mockDrivers } from "./data/mock";
import {
  acceptDriverInterest,
  fetchBIMetrics,
  fetchDriverInterests,
  fetchDrivers,
  fetchLoads,
  registerLoad,
  releaseDocs,
  requestInterest,
} from "./services/api";
import type { AuthProfile, CargoType, Driver, InterestNotification, Load, Match, ShipperBI } from "./types";

type ViewMode = "landing" | "plataforma";
type AccessMode = "operador" | "admin";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [metrics, setMetrics] = useState<ShipperBI>({
    deliveryEffectiveness: 99.4,
    freightSavings: 13,
    totalKm: 0,
    monthlyTrend: [96, 97, 98, 99],
  });
  const [activeDriverId, setActiveDriverId] = useState("drv-1");
  const [accessMode, setAccessMode] = useState<AccessMode>("operador");
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [pendingInterests, setPendingInterests] = useState<Match[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Carregamento Inicial de Dados
  useEffect(() => {
    async function loadData() {
      try {
        const [driversRes, loadsRes, biRes, interestsRes] = await Promise.all([
          fetchDrivers(),
          fetchLoads(),
          fetchBIMetrics(),
          fetchDriverInterests(),
        ]);
        setDrivers(driversRes.length > 0 ? driversRes : mockDrivers);
        setLoads(loadsRes);
        setMetrics(biRes);
        setPendingInterests(interestsRes);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    }
    loadData();
  }, []);

  // --- HANDLERS DAS AÇÕES DO DASHBOARD (O que faz os botões funcionarem) ---

  const handleRegisterLoad = async (payload: any) => {
    const newLoad = await registerLoad(payload);
    setLoads((prev) => [newLoad, ...prev]); // Adiciona a nova carga na lista
    return newLoad;
  };

  const handleSendInterest = async (driverId: string, loadId: string) => {
    await requestInterest(driverId, loadId);
    alert("Solicitação enviada ao motorista com sucesso!");
  };

  const handleAcceptInterest = async (matchId: string) => {
    await acceptDriverInterest(matchId);
    // Remove o interesse da lista de pendentes após aceitar
    setPendingInterests((prev) => prev.filter((m) => m._id !== matchId));
    alert("Match confirmado! O motorista foi notificado.");
  };

  const handleReleaseDocs = async (matchId: string) => {
    const response = await releaseDocs(matchId);
    return response.message || "Documentos emitidos com sucesso!";
  };

  const handleLogout = () => {
    setAuthProfile(null);
    setViewMode("landing");
  };

  // --- RENDERIZAÇÃO ---

  if (viewMode === "landing") {
    return (
      <main>
        <LandingPage
          drivers={drivers}
          onEntrar={(mode) => {
            setAccessMode(mode);
            setViewMode("plataforma");
          }}
        />
        <SupportChat />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-lg font-bold text-blue-950">Hubmotoristas.com.br</p>
            <p className="text-xs italic text-slate-600">O hub digital entre empresas e motoristas</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode("landing")} 
              className="rounded-md border border-[#FF6200] px-4 py-2 text-sm font-bold text-[#FF6200] hover:bg-[#FF6200] hover:text-white transition"
            >
              Tela inicial
            </button>
            {authProfile && (
               <button onClick={handleLogout} className="text-sm text-red-600 font-medium">Sair</button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl py-8">
        {/* Se não estiver logado, mostra tela de acesso */}
        {!authProfile ? (
          <PlatformAccess
            onCompanyLogin={(p) => setAuthProfile(p)}
            onDriverLogin={(p) => setAuthProfile(p)}
            // ... outros logins
          />
        ) : (
          /* Se logado, mostra o Dashboard de BI passando as funções */
          <ShipperBIDashboard
            drivers={drivers}
            metrics={metrics}
            loads={loads}
            pendingInterests={pendingInterests}
            onRegisterLoad={handleRegisterLoad}
            onSendInterest={handleSendInterest}
            onAcceptInterest={handleAcceptInterest}
            onReleaseDocs={handleReleaseDocs}
          />
        )}
      </div>

      <SupportChat />
    </main>
  );
}
