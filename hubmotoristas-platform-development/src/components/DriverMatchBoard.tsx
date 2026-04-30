import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DriverLocation, InterestNotification, Load, Match } from "../types";

interface DriverMatchBoardProps {
  loads: Load[];
  cargoPreferences: string[];
  driverLocation?: DriverLocation;
  notification: InterestNotification | null;
  confirmedMatch: Match | null;
  onDriverInterest: (loadId: string) => Promise<void>;
}

function proximityScore(load: Load, driverLocation?: DriverLocation) {
  if (!driverLocation) return 0;
  const destinationCityMatch = load.destinationCity.toLowerCase() === driverLocation.city.toLowerCase() ? 4 : 0;
  const destinationStateMatch = load.destinationState.toLowerCase() === driverLocation.state.toLowerCase() ? 3 : 0;
  const routeText = `${load.originPoint} ${load.destinationPoint}`.toLowerCase();
  const routeCityMention = routeText.includes(driverLocation.city.toLowerCase()) ? 2 : 0;
  return destinationCityMatch + destinationStateMatch + routeCityMention;
}

export function DriverMatchBoard({ loads, cargoPreferences, driverLocation, notification, confirmedMatch, onDriverInterest }: DriverMatchBoardProps) {
  const filteredLoads = useMemo(() => {
    return loads
      .filter((load) => cargoPreferences.length === 0 || cargoPreferences.includes(load.cargoType))
      .sort((a, b) => {
        const scoreA = proximityScore(a, driverLocation);
        const scoreB = proximityScore(b, driverLocation);
        if (scoreA !== scoreB) return scoreB - scoreA;
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        return Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0));
      });
  }, [loads, cargoPreferences, driverLocation]);
  const [index, setIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);

  const currentLoad = filteredLoads[index];

  useEffect(() => {
    setIndex(0);
  }, [filteredLoads.length]);

  async function handleConfirmInterest() {
    if (!currentLoad || filteredLoads.length === 0) return;
    setIsSubmittingInterest(true);
    setShowConfirmModal(false);
    try {
      await onDriverInterest(currentLoad._id);
      setInterestMessage("Interesse enviado com sucesso. A transportadora foi avisada e voce recebera retorno quando houver aceite.");
      setIndex((prev) => (prev + 1) % filteredLoads.length);
    } catch (_error) {
      setInterestMessage("Nao foi possivel enviar agora. Tente novamente em instantes.");
    } finally {
      setIsSubmittingInterest(false);
    }
  }

  function handleCloseConfirmModal() {
    setInterestMessage("Confirmacao registrada. Nenhum interesse foi enviado para esta carga.");
    setShowConfirmModal(false);
  }

  return (
    <section className="bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-[#FF6200]">Dashboard do Motorista</h2>
        <p className="mt-1 text-sm text-slate-300">Cards de match por lucratividade, tipo de produto e destino.</p>
        {driverLocation && (
          <p className="mt-1 text-xs text-slate-400">Cargas ordenadas por proximidade de {driverLocation.city}-{driverLocation.state}.</p>
        )}

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
               className="mt-4 rounded-md border border-[#FF6200]/40 bg-[#FF6200]/10 px-3 py-2 text-sm"
            >
               <p className="font-semibold text-[#FF6200]">{notification.title}</p>
              <p className="text-slate-200">{notification.body}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {confirmedMatch && (
          <div className="mt-4 rounded-md border border-[#FF6200]/40 bg-[#FF6200]/10 px-3 py-2 text-sm">
            <p className="font-semibold text-[#FF6200]">Match confirmado entre motorista e transportadora.</p>
            <p className="text-slate-200">Carga pronta para coleta. Voce ja pode buscar a carga com documentos liberados.</p>
          </div>
        )}

        {interestMessage && <p className="mt-3 text-sm text-[#FF6200]">{interestMessage}</p>}

        <div className="mt-5 flex min-h-72 items-center justify-center">
          <AnimatePresence mode="wait">
            {currentLoad ? (
              <motion.div
                key={currentLoad._id}
                initial={{ opacity: 0, scale: 0.92, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: -40 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-5"
              >
                <p className="text-xs uppercase tracking-wide text-[#FF6200]">{currentLoad.shipperName}</p>
                <p className="mt-2 text-lg font-semibold text-white">{currentLoad.cargoType}</p>
                <p className="mt-1 text-sm text-slate-300">{currentLoad.cargoDescription}</p>
                <p className="mt-1 text-sm text-slate-300">
                  Rota: {currentLoad.originPoint} ate {currentLoad.destinationPoint}
                </p>
                <p className="mt-1 text-sm text-slate-300">Destino final: {currentLoad.destinationCity}-{currentLoad.destinationState}</p>
                <p className="mt-3 text-2xl font-bold text-[#FF6200]">R$ {currentLoad.freightValue.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-slate-400">{currentLoad.distanceKm} km estimados</p>
                {currentLoad.requiredCertifications.length > 0 && (
                  <p className="mt-2 text-xs text-slate-300">Certificacoes exigidas: {currentLoad.requiredCertifications.join(", ")}</p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => {
                      if (filteredLoads.length === 0) return;
                      setIndex((prev) => (prev + 1) % filteredLoads.length);
                    }}
                    className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-200"
                  >
                    Passar
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full rounded-md bg-[#000B40] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
                  >
                    Tenho interesse
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-300">
                Nenhuma carga disponivel para sua especializacao no momento.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showConfirmModal && currentLoad && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
            >
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm rounded-md bg-white p-4 text-slate-900">
                <p className="text-lg font-semibold">Confirmar interesse</p>
                <p className="mt-2 text-sm text-slate-600">
                  Deseja enviar seu interesse para a transportadora na carga {currentLoad.cargoType}?
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleCloseConfirmModal}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isSubmittingInterest}
                    onClick={handleConfirmInterest}
                    className="w-full rounded-md bg-[#000B40] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingInterest ? "Enviando..." : "Enviar interesse"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}