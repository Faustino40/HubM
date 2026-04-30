import type { Driver } from "../types";

interface DriverRankingTableProps {
  drivers: Driver[];
}

function buildDriverIndicators(driver: Driver, rank: number) {
  const trips = Number(driver.completedTrips || 0);
  const rating = Number(driver.rating || 0);
  const experience = Number(driver.experienceYears || 0);

  const accidentIncidentIndex = driver.accidentIncidentIndex ?? Number(Math.max(0.2, 4.8 - rating + (300 - Math.min(trips, 300)) / 220).toFixed(2));
  const punctualityScore = driver.punctualityScore ?? Math.min(99.9, Number((90 + rating * 2).toFixed(1)));
  const routeComplianceScore = driver.routeComplianceScore ?? Math.min(99.9, Number((88 + rating * 2.2).toFixed(1)));
  const trafficFines = driver.trafficFines ?? Math.max(0, Math.round((6 - rating) + Math.max(0, 150 - trips) / 120));
  const customerServiceScore = driver.customerServiceScore ?? Math.min(10, Number((6 + rating * 0.8).toFixed(1)));
  const stressResistanceScore = driver.stressResistanceScore ?? Math.min(10, Number((5.5 + experience * 0.35).toFixed(1)));
  const commitmentScore = driver.commitmentScore ?? Math.min(10, Number((6.2 + (trips > 150 ? 1.4 : 0.8) + rating * 0.2).toFixed(1)));
  const defensiveDrivingLevel =
    driver.defensiveDrivingLevel ?? Math.min(10, Number((driver.certifications.some((item) => item.toLowerCase().includes("defensiva")) ? 9.4 : 7.2).toFixed(1)));

  return {
    rank,
    photoUrl: driver.photoUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(driver.fullName)}`,
    antt: driver.anttRegistry || `ANTT-${driver._id.slice(-6).toUpperCase()}`,
    trips,
    rating,
    accidentIncidentIndex,
    punctualityScore,
    routeComplianceScore,
    trafficFines,
    customerServiceScore,
    stressResistanceScore,
    commitmentScore,
    defensiveDrivingLevel,
    courses: driver.certifications.length > 0 ? driver.certifications.join(", ") : "Nao informado",
  };
}

export function DriverRankingTable({ drivers }: DriverRankingTableProps) {
  const ranking = [...drivers]
    .sort((a, b) => b.rating * 100 + b.completedTrips - (a.rating * 100 + a.completedTrips))
    .map((driver, index) => ({ driver, indicators: buildDriverIndicators(driver, index + 1) }));

  if (ranking.length === 0) {
    return <p className="text-sm text-slate-600">Nenhum motorista cadastrado para ranking no momento.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-[1500px] w-full bg-white text-left text-xs sm:text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Motorista</th>
            <th className="px-3 py-2">Qtd. transportes</th>
            <th className="px-3 py-2">Avaliacao</th>
            <th className="px-3 py-2">Indice acidentes/incidentes</th>
            <th className="px-3 py-2">Pontualidade</th>
            <th className="px-3 py-2">Cumprimento de rotas</th>
            <th className="px-3 py-2">Cursos especializados</th>
            <th className="px-3 py-2">Registro ANTT</th>
            <th className="px-3 py-2">Multas de transito</th>
            <th className="px-3 py-2">Atendimento ao cliente</th>
            <th className="px-3 py-2">Resistencia ao estresse</th>
            <th className="px-3 py-2">Comprometimento e assiduidade</th>
            <th className="px-3 py-2">Conducao defensiva</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map(({ driver, indicators }) => (
            <tr key={driver._id} className="border-t border-slate-200 align-top">
              <td className="px-3 py-3 font-semibold text-[#000B40]">{indicators.rank}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <img src={indicators.photoUrl} alt={`Foto de ${driver.fullName}`} className="h-8 w-8 rounded-full border border-slate-200" />
                  <div>
                    <p className="font-medium text-slate-900">{driver.fullName}</p>
                    <p className="text-xs text-slate-500">{driver.city}-{driver.state}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">{indicators.trips}</td>
              <td className="px-3 py-3">{indicators.rating.toFixed(1)} / 5.0</td>
              <td className="px-3 py-3">{indicators.accidentIncidentIndex}%</td>
              <td className="px-3 py-3">{indicators.punctualityScore}%</td>
              <td className="px-3 py-3">{indicators.routeComplianceScore}%</td>
              <td className="px-3 py-3">{indicators.courses}</td>
              <td className="px-3 py-3">{indicators.antt}</td>
              <td className="px-3 py-3">{indicators.trafficFines}</td>
              <td className="px-3 py-3">{indicators.customerServiceScore}/10</td>
              <td className="px-3 py-3">{indicators.stressResistanceScore}/10</td>
              <td className="px-3 py-3">{indicators.commitmentScore}/10</td>
              <td className="px-3 py-3">{indicators.defensiveDrivingLevel}/10</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}