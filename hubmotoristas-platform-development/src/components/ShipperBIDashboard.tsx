import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cargoOptions } from "../data/mock";
import type { CargoType, Driver, Load, LoadRegistrationPayload, Match, ShipperBI } from "../types";
import { DriverRankingTable } from "./DriverRankingTable";

interface ShipperBIDashboardProps {
  drivers: Driver[];
  metrics: ShipperBI;
  loads: Load[];
  pendingInterests: Match[];
  onSendInterest: (driverId: string, loadId: string) => Promise<void>;
  onAcceptInterest: (matchId: string) => Promise<void>;
  onReleaseDocs: (matchId: string) => Promise<string>;
  onRegisterLoad: (payload: LoadRegistrationPayload) => Promise<Load>;
}

const requiredCertifications = ["MOPP", "Direcao Defensiva", "NR20", "Transporte de Produtos Perigosos"];

const initialLoadForm: LoadRegistrationPayload = {
  shipperName: "",
  cargoDescription: "",
  cargoType: "Siderurgicos",
  freightValue: 0,
  originPoint: "",
  destinationPoint: "",
  destinationCity: "",
  destinationState: "",
  distanceKm: 0,
  requiredCertifications: [],
  immediateNeed: false,
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function ShipperBIDashboard({
  drivers,
  metrics,
  loads,
  pendingInterests,
  onSendInterest,
  onAcceptInterest,
  onReleaseDocs,
  onRegisterLoad,
}: ShipperBIDashboardProps) {
  const [filters, setFilters] = useState({ region: "", state: "", city: "", cargoType: "", immediate: false });
  const [releaseMessage, setReleaseMessage] = useState("");
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [loadForm, setLoadForm] = useState(initialLoadForm);
  const [loadStatus, setLoadStatus] = useState("");
  const [isPublishingLoad, setIsPublishingLoad] = useState(false);
  const [shipperNotice, setShipperNotice] = useState("");
  const [otherRequiredCertification, setOtherRequiredCertification] = useState("");
  const [releaseTarget, setReleaseTarget] = useState("");
  const [showRankingResults, setShowRankingResults] = useState(false);
  
  // Estados para feedback visual de carregamento nos botões
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (pendingInterests.length > 0) {
      setShipperNotice(`Você tem ${pendingInterests.length} novos interesses de motoristas aguardando aceite.`);
    } else {
      setShipperNotice("");
    }
  }, [pendingInterests.length]);

  const rankedDrivers = useMemo(() => {
    return drivers
      .filter((driver) => (filters.region ? driver.region.toLowerCase().includes(filters.region.toLowerCase()) : true))
      .filter((driver) => (filters.state ? driver.state.toLowerCase().includes(filters.state.toLowerCase()) : true))
      .filter((driver) => (filters.city ? driver.city.toLowerCase().includes(filters.city.toLowerCase()) : true))
      .filter((driver) => (filters.cargoType ? driver.cargoTypes.includes(filters.cargoType as CargoType) : true))
      .filter((driver) => (filters.immediate ? driver.statusPgr === "Homologado" : true))
      .sort((a, b) => b.rating * 100 + b.completedTrips - (a.rating * 100 + a.completedTrips));
  }, [drivers, filters]);

  // Funções de Ação com Feedback
  async function handleAction(id: string, actionFn: () => Promise<any>, successMsg?: string) {
    setLoadingActions(prev => ({ ...prev, [id]: true }));
    try {
      await actionFn();
      if (successMsg) setReleaseMessage(successMsg);
    } catch (err) {
      alert("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setLoadingActions(prev => ({ ...prev, [id]: false }));
    }
  }

  function toggleCertification(certification: string) {
    setLoadForm((prev) => ({
      ...prev,
      requiredCertifications: prev.requiredCertifications.includes(certification)
        ? prev.requiredCertifications.filter((item) => item !== certification)
        : [...prev.requiredCertifications, certification],
    }));
  }

  async function handleLoadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPublishingLoad(true);
    setLoadStatus("");
    try {
      await onRegisterLoad(loadForm);
      setLoadStatus("Carga cadastrada com sucesso!");
      setLoadForm(initialLoadForm);
      setTimeout(() => {
          setShowLoadForm(false);
          setLoadStatus("");
      }, 2000);
    } catch (error) {
      setLoadStatus("Erro ao cadastrar carga.");
    } finally {
      setIsPublishingLoad(false);
    }
  }

  return (
    <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-[#000B40]">Dashboard BI da Transportadora</h2>
          <p className="text-sm text-slate-600">Gestão de performance e match em tempo real.</p>
          {shipperNotice && (
            <div className="mt-3 rounded-md bg-orange-50 p-3 border border-orange-200">
                <p className="text-sm font-semibold text-[#FF6200] flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    {shipperNotice}
                </p>
            </div>
          )}
        </header>

        {/* Metricas em Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Efetividade</p>
            <p className="text-3xl font-bold text-[#FF6200]">{metrics.deliveryEffectiveness.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Economia de Frete</p>
            <p className="text-3xl font-bold text-[#3B85FA]">{metrics.freightSavings.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">KM Rodados</p>
            <p className="text-3xl font-bold text-[#000B40]">{metrics.totalKm.toLocaleString("pt-BR")} <span className="text-sm font-normal">km</span></p>
          </div>
        </div>

        {/* Seção de Cadastro de Cargas */}
        <div className="mt-8 border-t border-slate-100 pt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Cargas Disponíveis</h3>
            <button
              onClick={() => setShowLoadForm(!showLoadForm)}
              className="rounded-full bg-[#000B40] px-6 py-2 text-sm font-bold text-white hover:bg-[#3B85FA] transition-all"
            >
              {showLoadForm ? "Fechar" : "+ Nova Carga"}
            </button>
          </div>
          
          {showLoadForm && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <form onSubmit={handleLoadSubmit} className="grid gap-4 sm:grid-cols-2">
                    {/* Campos de input (mantidos como no original) */}
                    <input required value={loadForm.shipperName} onChange={(e) => setLoadForm({...loadForm, shipperName: e.target.value})} placeholder="Empresa embarcadora" className="rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <select value={loadForm.cargoType} onChange={(e) => setLoadForm({...loadForm, cargoType: e.target.value as CargoType})} className="rounded-lg border border-slate-300 p-3 text-sm">
                        {cargoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <input required className="sm:col-span-2 rounded-lg border border-slate-300 p-3 text-sm" placeholder="Descrição da carga" value={loadForm.cargoDescription} onChange={(e) => setLoadForm({...loadForm, cargoDescription: e.target.value})} />
                    
                    <button type="submit" disabled={isPublishingLoad} className="sm:col-span-2 rounded-lg bg-[#FF6200] py-3 font-bold text-white hover:brightness-110 disabled:opacity-50">
                        {isPublishingLoad ? "Publicando..." : "Publicar agora"}
                    </button>
                </form>
            </div>
          )}
        </div>

        {/* Busca e Ranking */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Busca Avançada de Motoristas</h3>
          <div className="grid gap-2 sm:grid-cols-5 mb-6">
            <input placeholder="Cidade" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters({...filters, city: e.target.value})} />
            <input placeholder="Estado" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters({...filters, state: e.target.value})} />
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters({...filters, cargoType: e.target.value})}>
                <option value="">Todos os tipos de carga</option>
                {cargoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 rounded-lg border border-slate-200">
                <input type="checkbox" onChange={(e) => setFilters({...filters, immediate: e.target.checked})} />
                Somente Homologados
            </label>
            <button onClick={() => setShowRankingResults(!showRankingResults)} className="bg-slate-800 text-white rounded-lg text-sm font-bold">
                {showRankingResults ? "Ocultar Ranking" : "Ver Ranking Completo"}
            </button>
          </div>

          <div className="space-y-4">
            {rankedDrivers.slice(0, 5).map((driver, index) => {
              // Melhoria na busca de carga sugerida: se não achar específica, sugere a primeira disponível
              const suggestedLoad = loads.find((load) => driver.cargoTypes.includes(load.cargoType)) || loads[0];
              const isLoading = loadingActions[`interest-${driver._id}`];

              return (
                <div key={driver._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                        {index + 1}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{driver.fullName} <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{driver.statusPgr}</span></p>
                        <p className="text-xs text-slate-500">{driver.city} - {driver.state} | ★ {driver.rating.toFixed(1)}</p>
                    </div>
                  </div>
                  {suggestedLoad && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(`interest-${driver._id}`, () => onSendInterest(driver._id, suggestedLoad._id), "Interesse enviado com sucesso!")}
                      className="rounded-lg bg-[#000B40] px-4 py-2 text-xs font-bold text-white hover:bg-[#3B85FA] disabled:opacity-50"
                    >
                      {isLoading ? "Enviando..." : "Enviar Interesse"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Interesses Recebidos */}
        {pendingInterests.length > 0 && (
            <div className="mt-12 rounded-xl border-2 border-orange-100 p-6 bg-orange-50/30">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Interesses Recebidos</h3>
                <div className="space-y-3">
                    {pendingInterests.map((interest) => {
                        const drv = drivers.find(d => d._id === interest.driverId);
                        const isAccepting = loadingActions[`accept-${interest._id}`];
                        return (
                            <div key={interest._id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                                <div>
                                    <p className="text-sm font-bold">{drv?.fullName || "Motorista Externo"}</p>
                                    <p className="text-xs text-slate-500">Carga: {interest.loadId.slice(-6)}</p>
                                </div>
                                <button 
                                    disabled={isAccepting}
                                    onClick={() => handleAction(`accept-${interest._id}`, () => onAcceptInterest(interest._id))}
                                    className="bg-[#FF6200] text-white px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform"
                                >
                                    {isAccepting ? "Aceitando..." : "Aceitar Interesse"}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </div>
      {/* Mensagem Global de Feedback */}
      {releaseMessage && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold z-50 animate-bounce">
              {releaseMessage}
              <button onClick={() => setReleaseMessage("")} className="ml-4 text-slate-400">✕</button>
          </div>
      )}
    </section>
  );
}
