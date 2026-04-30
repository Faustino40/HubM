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
      } catch {
        // Sem corpo JSON na resposta de erro.
      }
      throw new Error(message);
    }
    return (await response.json()) as T;
  } catch (_error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw _error;
  }
}

export function fetchBIMetrics() {
  return safeFetch<ShipperBI>("/shipper/bi", undefined, mockBi);
}

export function fetchDrivers() {
  return safeFetch<Driver[]>("/drivers", undefined, mockDrivers);
}

export function fetchLoads() {
  return safeFetch<Load[]>("/loads", undefined, mockLoads);
}

export function registerLoad(payload: LoadRegistrationPayload) {
  return safeFetch<Load>(
    "/loads",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      _id: `load-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    }
  );
}

export function registerDriver(payload: DriverRegistrationPayload) {
  return safeFetch<Driver>(
    "/drivers",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      _id: `drv-${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email,
      cpf: payload.cpf,
      rg: payload.rg,
      cargoTypes: payload.cargoTypes,
      city: payload.city,
      state: payload.state,
      region: payload.region,
      experienceYears: payload.experienceYears,
      certifications: payload.certifications,
      statusPgr: "Em Analise de PGR",
      verifiedSeal: false,
      rating: 4.5,
      completedTrips: 0,
    }
  );
}

export function requestInterest(driverId: string, loadId: string, carrierName: string) {
  return safeFetch<{ message?: string }>(
    "/matches/interest",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, loadId, carrierName }),
    },
    { message: "Interesse simulado em ambiente local." }
  );
}

export function driverExpressInterest(driverId: string, loadId: string, carrierName: string) {
  return safeFetch<Match>(
    "/matches/driver-interest",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, loadId, carrierName }),
    },
    {
      _id: `match-${Date.now()}`,
      driverId,
      loadId,
      carrierName,
      status: "Interesse do Motorista",
    }
  );
}

export function fetchDriverInterests() {
  return safeFetch<Match[]>("/matches?status=Interesse%20do%20Motorista", undefined, []);
}

export function acceptDriverInterest(matchId: string) {
  return safeFetch<Match>(
    `/matches/${matchId}/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
    {
      _id: matchId,
      driverId: "drv-1",
      loadId: "load-1",
      carrierName: "Hubmotoristas Transportes",
      status: "Match Aceito",
      acceptedAt: new Date().toISOString(),
    }
  );
}

export function registerCompany(payload: { companyName: string; email: string; password: string }) {
  return safeFetch<AuthSession>(
    "/companies/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      token: `session-${Date.now()}`,
      profile: {
        _id: `cmp-${Date.now()}`,
        name: payload.companyName,
        email: payload.email,
        role: "company",
      },
    }
  );
}

export function loginCompany(payload: { email: string; password: string }) {
  return safeFetch<AuthSession>(
    "/companies/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      token: `session-${Date.now()}`,
      profile: {
        _id: "cmp-local",
        name: "Transportadora Local",
        email: payload.email,
        role: "company",
      },
    }
  );
}

export function registerPlatformUser(payload: { fullName: string; email: string; password: string }) {
  return safeFetch<AuthSession>(
    "/users/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      token: `session-${Date.now()}`,
      profile: {
        _id: `usr-${Date.now()}`,
        name: payload.fullName,
        email: payload.email,
        role: "user",
      },
    }
  );
}

export function loginPlatformUser(payload: { email: string; password: string }) {
  return safeFetch<AuthSession>(
    "/users/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      token: `session-${Date.now()}`,
      profile: {
        _id: "usr-local",
        name: "Usuario Local",
        email: payload.email,
        role: "user",
      },
    }
  );
}

export function loginDriver(payload: { email: string; password: string }) {
  return safeFetch<AuthSession>(
    "/drivers/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      token: `session-${Date.now()}`,
      profile: {
        _id: "dacc-local",
        name: "Motorista Local",
        email: payload.email,
        role: "driver",
        driverId: "drv-1",
      },
    }
  );
}

export function updateProfile(payload: { role: AuthProfile["role"]; id: string; name: string; email: string; password?: string }) {
  return safeFetch<{ profile: AuthProfile }>(
    "/profile",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      profile: {
        _id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    }
  );
}

export function updateDriverFullProfile(payload: {
  role: "driver";
  id: string;
  name: string;
  email: string;
  password?: string;
  driverData: {
    phone: string;
    cpf: string;
    rg: string;
    cep: string;
    street: string;
    district: string;
    city: string;
    state: string;
    region: string;
    experienceYears: number;
    cargoTypes: CargoType[];
    certifications: string[];
    cnhFileName: string;
  };
}) {
  return safeFetch<{ profile: AuthProfile }>(
    "/profile",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    {
      profile: {
        _id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    }
  );
}

export function recoverPlatformPassword(payload: { email: string }) {
  return safeFetch<{ registered: boolean; message: string }>(
    "/auth/recover-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { registered: false, message: "E-mail não cadastrado" }
  );
}

export function releaseDocs(matchId: string) {
  return safeFetch<{ message: string }>(
    "/documents/release",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    },
    { message: "Documentos fiscais liberados em ate 1 hora." }
  );
}