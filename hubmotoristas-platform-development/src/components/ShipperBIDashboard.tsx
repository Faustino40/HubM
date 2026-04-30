import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cargoOptions } from "../data/mock";
import type { CargoType, Driver, Load, LoadRegistrationPayload, Match, ShipperBI } from "../types";

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
  const [filters, setFilters] = useState({ city: "", cargoType: "", immediate: false });
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [loadForm, setLoadForm] = useState<LoadRegistrationPayload>({
    shipperName: "", cargoDescription: "", cargoType: "Siderurgicos", freightValue: 0,
    originPoint: "", destinationPoint: "", destinationCity: "", destinationState: "",
    distanceKm: 0, requiredCertifications: [], immediateNeed: false
  });
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const rankedDrivers = useMemo(() => {
    return drivers
      .filter(d => filters.city ? d.city.toLowerCase().includes(filters.city.toLowerCase()) : true)
      .filter(d => filters.cargoType ? d.cargoTypes.includes(filters.cargoType as CargoType) : true)
      .filter(d => filters.immediate ? d.statusPgr === "Homologado" : true)
      .sort((a, b) => b.rating - a.rating);
  }, [drivers, filters]);

  async function handleAction(id: string, actionFn: () => Promise<any>, successMsg: string) {
    setLoadingActions(prev => ({ ...prev, [id]: true }));
    try {
      await actionFn();
      setFeedbackMsg(successMsg);
      setTimeout(() => setFeedbackMsg(""), 4000);
    } catch (err) {
      alert("Erro na operação.");
    } finally {
      setLoadingActions(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-[#000B40]">Dashboard de Operações</h2>
          <p className="text-slate-500">Gestão de performance e match de motoristas.</p>
        </div>
        <button 
          onClick={() => setShowLoadForm(!showLoadForm)}
          className="bg-[#000B40] text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-900 transition"
        >
          {showLoadForm ? "Fechar" : "+ Nova Carga"}
        </button>
      </header>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-bold uppercase">Efetividade</p>
          <p className="text-2xl font-black text-[#FF6200]">{metrics.deliveryEffectiveness}%</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-bold uppercase">Economia</p>
          <p className="text-2xl font-black text-blue-600">{metrics.freightSavings}%</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-bold uppercase">Frota Ativa</p>
          <p className="text-2xl font-black text-[#000B40]">{drivers.length} motoristas</p>
        </div>
      </div>

      {/* Cadastro de Carga */}
      {showLoadForm && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          await handleAction("new-load", () => onRegisterLoad(loadForm), "Carga publicada!");
          setShowLoadForm(false);
        }} className="mb-8 p-6 bg-blue-50/50 rounded-xl grid grid-cols-2 gap-4">
          <input className="p-3 rounded-lg border" placeholder="Embarcador" onChange={e => setLoadForm({...loadForm, shipperName: e.target.value})} required />
          <select className="p-3 rounded-lg border" onChange={e => setLoadForm({...loadForm, cargoType: e.target.value as CargoType})}>
            {cargoOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input className="p-3 rounded-lg border col-span-2" placeholder="Descrição da Carga" onChange={e => setLoadForm({...loadForm, cargoDescription: e.target.value})} required />
          <button disabled={loadingActions["new-load"]} className="col-span-2 bg-[#FF6200] text-white py-3 rounded-lg font-bold">
            {loadingActions["new-load"] ? "Publicando..." : "Publicar Carga"}
          </button>
        </form>
      )}

      {/* Lista de Motoristas e Busca */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800">Ranking de Motoristas Próximos</h3>
        <div className="flex gap-2 mb-4">
          <input placeholder="Filtrar cidade..." className="p-2 border rounded-lg text-sm flex-1" onChange={e => setFilters({...filters, city: e.target.value})} />
        </div>
        
        {rankedDrivers.slice(0, 5).map(driver => (
          <div key={driver._id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">{driver.fullName[0]}</div>
              <div>
                <p className="font-bold text-sm text-slate-900">{driver.fullName}</p>
                <p className="text-xs text-slate-500">{driver.city} • ★ {driver.rating}</p>
              </div>
            </div>
            <button 
              disabled={loadingActions[driver._id]}
              onClick={() => handleAction(driver._id, () => onSendInterest(driver._id, loads[0]?._id || "temp"), "Convite enviado!")}
              className="text-xs font-bold bg-[#000B40] text-white px-4 py-2 rounded-lg"
            >
              {loadingActions[driver._id] ? "Enviando..." : "Enviar Interesse"}
            </button>
          </div>
        ))}
      </div>

      {/* Toast de Feedback */}
      {feedbackMsg && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-4">
          {feedbackMsg}
        </div>
      )}
    </section>
  );
}
