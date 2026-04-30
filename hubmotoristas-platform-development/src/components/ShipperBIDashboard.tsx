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

  useEffect(() => {
    if (pendingInterests.length > 0) {
      setShipperNotice("Novo aviso: um motorista demonstrou interesse em uma carga e aguarda seu aceite.");
    }
  }, [pendingInterests.length]);

  const rankedDrivers = useMemo(() => {
    return drivers
      .filter((driver) => (filters.region ? driver.region === filters.region : true))
      .filter((driver) => (filters.state ? driver.state === filters.state : true))
      .filter((driver) => (filters.city ? driver.city === filters.city : true))
      .filter((driver) => (filters.cargoType ? driver.cargoTypes.includes(filters.cargoType as Driver["cargoTypes"][number]) : true))
      .filter((driver) => (filters.immediate ? driver.statusPgr === "Homologado" : true))
      .sort((a, b) => b.rating * 100 + b.completedTrips - (a.rating * 100 + a.completedTrips));
  }, [drivers, filters]);

  function toggleCertification(certification: string) {
    setLoadForm((prev) => ({
      ...prev,
      requiredCertifications: prev.requiredCertifications.includes(certification)
        ? prev.requiredCertifications.filter((item) => item !== certification)
        : [...prev.requiredCertifications, certification],
    }));
  }

  function addRequiredCertification() {
    const normalized = otherRequiredCertification.trim();
    if (!normalized) return;
    const alreadyExists = loadForm.requiredCertifications.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (!alreadyExists) {
      setLoadForm((prev) => ({ ...prev, requiredCertifications: [...prev.requiredCertifications, normalized] }));
    }
    setOtherRequiredCertification("");
  }

  async function handleLoadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPublishingLoad(true);
    setLoadStatus("");
    try {
      await onRegisterLoad(loadForm);
      setLoadStatus("Carga cadastrada com sucesso e publicada para match de motoristas.");
      setLoadForm(initialLoadForm);
      setOtherRequiredCertification("");
      setShowLoadForm(false);
    } catch (error) {
      setLoadStatus(error instanceof Error ? error.message : "Nao foi possivel cadastrar a carga. Tente novamente.");
    } finally {
      setIsPublishingLoad(false);
    }
  }

  return (
    <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-[#000B40]">Dashboard BI da Transportadora</h2>
        <p className="mt-1 text-sm text-slate-600">Monitoramento de efetividade, economia e quilometragem com foco na meta de 99,4%.</p>
        {shipperNotice && <p className="mt-2 text-sm font-medium text-[#FF6200]">{shipperNotice}</p>}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Efetividade de entrega</p>
            <p className="text-3xl font-semibold text-[#FF6200]">{metrics.deliveryEffectiveness.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Economia de frete</p>
            <p className="text-3xl font-semibold text-[#FF6200]">{metrics.freightSavings.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Quilometragem rodada</p>
            <p className="text-3xl font-semibold text-[#000B40]">{metrics.totalKm.toLocaleString("pt-BR")} km</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-slate-700">Evolucao mensal da efetividade</p>
          <div className="mt-2 rounded-md border border-slate-200 p-3">
            <svg viewBox="0 0 320 140" className="h-40 w-full">
              <line x1="20" y1="120" x2="300" y2="120" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="20" y1="20" x2="20" y2="120" stroke="#cbd5e1" strokeWidth="1" />
              <polyline
                fill="none"
                stroke="#3B85FA"
                strokeWidth="3"
                points={metrics.monthlyTrend
                  .map((value, index) => {
                    const x = 20 + (index * 280) / Math.max(metrics.monthlyTrend.length - 1, 1);
                    const y = 120 - ((value - 90) / 10) * 100;
                    return `${x},${Math.max(20, Math.min(120, y))}`;
                  })
                  .join(" ")}
              />
              {metrics.monthlyTrend.map((value, index) => {
                const x = 20 + (index * 280) / Math.max(metrics.monthlyTrend.length - 1, 1);
                const y = 120 - ((value - 90) / 10) * 100;
                return <circle key={`${value}-${index}`} cx={x} cy={Math.max(20, Math.min(120, y))} r="3.5" fill="#000B40" />;
              })}
            </svg>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-slate-600">
              {metrics.monthlyTrend.map((value, index) => (
                <p key={`legend-${index}`}>
                  {monthLabels[index] || `M${index + 1}`}: {value.toFixed(1)}%
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Gestao de cargas disponiveis</h3>
            <button
              onClick={() => setShowLoadForm((prev) => !prev)}
               className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
            >
              {showLoadForm ? "Fechar cadastro de carga" : "Cadastrar carga disponivel"}
            </button>
          </div>
          {showLoadForm && (
            <form onSubmit={handleLoadSubmit} className="mt-4 grid gap-2 sm:grid-cols-2">
              <input
                required
                value={loadForm.shipperName}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, shipperName: e.target.value }))}
                placeholder="Empresa embarcadora"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={loadForm.cargoType}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, cargoType: e.target.value as CargoType }))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {cargoOptions.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
              <input
                required
                value={loadForm.cargoDescription}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, cargoDescription: e.target.value }))}
                placeholder="Descricao da carga"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                required
                type="number"
                min={0}
                value={loadForm.freightValue === 0 ? "" : loadForm.freightValue}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, freightValue: Number(e.target.value) || 0 }))}
                placeholder="Valor do frete (R$)"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                min={1}
                value={loadForm.distanceKm === 0 ? "" : loadForm.distanceKm}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, distanceKm: Number(e.target.value) || 0 }))}
                placeholder="Distancia (km)"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                value={loadForm.originPoint}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, originPoint: e.target.value }))}
                placeholder="Ponto de partida"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                value={loadForm.destinationPoint}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, destinationPoint: e.target.value }))}
                placeholder="Ponto de chegada"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                value={loadForm.destinationCity}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, destinationCity: e.target.value }))}
                placeholder="Cidade de destino"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                value={loadForm.destinationState}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, destinationState: e.target.value }))}
                placeholder="Estado de destino"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-700">Certificacoes necessarias</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {requiredCertifications.map((certification) => (
                    <label key={certification} className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={loadForm.requiredCertifications.includes(certification)}
                        onChange={() => toggleCertification(certification)}
                      />
                      {certification}
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={otherRequiredCertification}
                    onChange={(e) => setOtherRequiredCertification(e.target.value)}
                    placeholder="Outras certificacoes necessarias"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addRequiredCertification}
                    className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={loadForm.immediateNeed}
                  onChange={(e) => setLoadForm((prev) => ({ ...prev, immediateNeed: e.target.checked }))}
                />
                Necessidade imediata da empresa
              </label>
              <button
                type="submit"
                disabled={isPublishingLoad}
                 className="sm:col-span-2 rounded-md bg-[#000B40] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3B85FA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPublishingLoad ? "Publicando..." : "Publicar carga para motoristas"}
              </button>
            </form>
          )}
          {loadStatus && <p className="mt-3 text-sm font-medium text-[#FF6200]">{loadStatus}</p>}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Busca por ranking e filtros avancados</h3>
            <button
              onClick={() => setShowRankingResults((prev) => !prev)}
              className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
            >
              {showRankingResults ? "Ocultar resultados" : "Ver Resultados"}
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <input placeholder="Regiao" className="rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))} />
            <input placeholder="Estado" className="rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))} />
            <input placeholder="Cidade" className="rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))} />
            <input placeholder="Tipo de carga" className="rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters((prev) => ({ ...prev, cargoType: e.target.value }))} />
            <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <input type="checkbox" onChange={(e) => setFilters((prev) => ({ ...prev, immediate: e.target.checked }))} />
              Necessidade imediata
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {rankedDrivers.slice(0, 3).map((driver, index) => {
              const suggestedLoad = loads.find((load) => driver.cargoTypes.includes(load.cargoType));
              return (
                <div key={driver._id} className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      #{index + 1} {driver.fullName} {driver.verifiedSeal ? "- Selo Verificado" : "- Em Analise"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Avaliacao {driver.rating.toFixed(1)} | Viagens {driver.completedTrips} | {driver.city}-{driver.state}
                    </p>
                  </div>
                  {suggestedLoad && (
                    <button
                      onClick={() => onSendInterest(driver._id, suggestedLoad._id)}
                       className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
                    >
                      Enviar interesse
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {showRankingResults && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">Ranking completo de todos os motoristas cadastrados</p>
              <DriverRankingTable drivers={rankedDrivers} />
            </div>
          )}

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Liberacao em 1 hora</p>
            <p className="mt-1 text-xs text-slate-600">Selecione um match para emitir os documentos fiscais e liberar a coleta.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                value={releaseTarget}
                onChange={(event) => setReleaseTarget(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecione um match para liberar</option>
                {pendingInterests.map((interest) => (
                  <option key={interest._id} value={interest._id}>
                    Match {interest._id.slice(0, 8)} - carga {interest.loadId.slice(0, 8)}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  if (!releaseTarget) {
                    setReleaseMessage("Selecione um match para liberar os documentos.");
                    return;
                  }
                  const message = await onReleaseDocs(releaseTarget);
                  setReleaseMessage(message);
                }}
                className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
              >
                Emitir documentos agora
              </button>
            </div>
          </div>
          {releaseMessage && <p className="mt-2 text-sm text-[#FF6200]">{releaseMessage}</p>}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-900">Interesses recebidos de motoristas</h3>
          <p className="mt-1 text-sm text-slate-600">Aceite o interesse para fechar match em ambas as partes.</p>
          <div className="mt-4 space-y-3">
            {pendingInterests.length === 0 && <p className="text-sm text-slate-500">Nenhum interesse pendente no momento.</p>}
            {pendingInterests.map((interest) => {
              const load = loads.find((item) => item._id === interest.loadId);
              const driver = drivers.find((item) => item._id === interest.driverId);
              return (
                <div key={interest._id} className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {driver?.fullName || "Motorista"} demonstrou interesse em {load?.cargoType || "carga"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Rota: {load?.originPoint || "Origem"} ate {load?.destinationPoint || "Destino"}
                    </p>
                  </div>
                  <button
                    onClick={() => onAcceptInterest(interest._id)}
                    className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
                  >
                    Aceitar interesse
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}