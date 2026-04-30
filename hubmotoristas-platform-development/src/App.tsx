import { useEffect, useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { PlatformAccess } from "./components/PlatformAccess";
import { ShipperBIDashboard } from "./components/ShipperBIDashboard";
import { SupportChat } from "./components/SupportChat";
import { 
  fetchDrivers, fetchLoads, fetchBIMetrics, fetchDriverInterests,
  registerLoad, requestInterest, acceptDriverInterest, releaseDocs, loginCompany 
} from "./services/api";
import type { Driver, Load, Match, ShipperBI, AuthProfile } from "./types";

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "plataforma">("landing");
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [pendingInterests, setPendingInterests] = useState<Match[]>([]);
  const [metrics, setMetrics] = useState<ShipperBI>({ deliveryEffectiveness: 0, freightSavings: 0, totalKm: 0, monthlyTrend: [] });

  useEffect(() => {
    async function init() {
      const [d, l, m, i] = await Promise.all([fetchDrivers(), fetchLoads(), fetchBIMetrics(), fetchDriverInterests()]);
      setDrivers(d); setLoads(l); setMetrics(m); setPendingInterests(i);
    }
    init();
  }, []);

  // Handlers Reativos
  const handleRegisterLoad = async (payload: any) => {
    const res = await registerLoad(payload);
    setLoads(prev => [res, ...prev]);
    return res;
  };

  const handleSendInterest = async (dId: string, lId: string) => {
    await requestInterest(dId, lId, authProfile?.name || "Hub Transportadora");
  };

  const handleAcceptInterest = async (mId: string) => {
    await acceptDriverInterest(mId);
    setPendingInterests(prev => prev.filter(m => m._id !== mId));
  };

  if (viewMode === "landing") {
    return (
      <>
        <LandingPage drivers={drivers} onEntrar={() => setViewMode("plataforma")} />
        <SupportChat />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-[#000B40]">Hubmotoristas.com.br</h1>
          <button onClick={() => setViewMode("landing")} className="text-[#FF6200] font-bold text-sm">Sair</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {!authProfile ? (
          <PlatformAccess onCompanyLogin={(p) => setAuthProfile(p.profile)} onDriverLogin={() => {}} onUserLogin={() => {}} onRecoverPassword={async () => {}} onCompanyRegister={async () => ({})} onUserRegister={async () => ({})} />
        ) : (
          <ShipperBIDashboard 
            drivers={drivers} metrics={metrics} loads={loads} pendingInterests={pendingInterests}
            onRegisterLoad={handleRegisterLoad} onSendInterest={handleSendInterest}
            onAcceptInterest={handleAcceptInterest} onReleaseDocs={releaseDocs}
          />
        )}
      </div>
      <SupportChat />
    </main>
  );
}
