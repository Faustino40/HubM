import { mockBi, mockDrivers, mockLoads } from "../data/mock";
import type {
  AuthProfile,
  AuthSession,
  CargoType,
  Driver,
  DriverRegistrationPayload,
  Load,
  LoadRegistrationPayload,
  Match,
  ShipperBI,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function safeFetch<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, init);
    if (!response.ok) {
      let message = `Falha em ${path}`;
      try {
        const payload = (await response.json()) as { error?: string; message?: string };
        message = payload.error || payload.message || message;
      } catch { }
      throw new Error(message);
    }
    return (await response.json()) as T;
  } catch (_error) {
    if (fallback !== undefined) return fallback;
    throw _error;
  }
}

export const fetchBIMetrics = () => safeFetch<ShipperBI>("/shipper/bi", undefined, mockBi);
export const fetchDrivers = () => safeFetch<Driver[]>("/drivers", undefined, mockDrivers);
export const fetchLoads = () => safeFetch<Load[]>("/loads", undefined, mockLoads);

export function registerLoad(payload: LoadRegistrationPayload) {
  return safeFetch<Load>("/loads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, {
    _id: `load-${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  });
}

export function requestInterest(driverId: string, loadId: string, carrierName: string) {
  return safeFetch<{ message: string }>("/matches/interest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId, loadId, carrierName }),
  }, { message: "Interesse enviado com sucesso!" });
}

export function acceptDriverInterest(matchId: string) {
  return safeFetch<Match>(`/matches/${matchId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    _id: matchId,
    driverId: "drv-1",
    loadId: "load-1",
    carrierName: "Hubmotoristas",
    status: "Match Aceito",
    acceptedAt: new Date().toISOString(),
  });
}

export function fetchDriverInterests() {
  return safeFetch<Match[]>("/matches?status=Interesse%20do%20Motorista", undefined, []);
}

export function releaseDocs(matchId: string) {
  return safeFetch<{ message: string }>("/documents/release", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId }),
  }, { message: "Documentos liberados com sucesso." });
}

// Auth functions permanecem conforme seu original...
export const loginCompany = (payload: any) => safeFetch<AuthSession>("/companies/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, { token: "tok", profile: { _id: "cmp-1", name: "Transportadora Hub", email: payload.email, role: "company" } });
export const registerDriver = (p: any) => safeFetch<Driver>("/drivers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
