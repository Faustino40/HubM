export type CargoType = string;

export interface Driver {
  _id: string;
  fullName: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  cpf: string;
  rg: string;
  anttRegistry?: string;
  cargoTypes: CargoType[];
  cep?: string;
  street?: string;
  district?: string;
  city: string;
  state: string;
  region: string;
  experienceYears: number;
  certifications: string[];
  cnhFileName?: string;
  statusPgr: "Em Analise de PGR" | "Homologado";
  verifiedSeal: boolean;
  rating: number;
  completedTrips: number;
  accidentIncidentIndex?: number;
  punctualityScore?: number;
  routeComplianceScore?: number;
  trafficFines?: number;
  customerServiceScore?: number;
  stressResistanceScore?: number;
  commitmentScore?: number;
  defensiveDrivingLevel?: number;
}

export interface Load {
  _id: string;
  shipperName: string;
  cargoDescription: string;
  cargoType: CargoType;
  freightValue: number;
  originPoint: string;
  destinationPoint: string;
  destinationCity: string;
  destinationState: string;
  distanceKm: number;
  requiredCertifications: string[];
  immediateNeed: boolean;
  createdAt?: string;
}

export interface DriverLocation {
  city: string;
  state: string;
  region: string;
}

export interface ShipperBI {
  deliveryEffectiveness: number;
  freightSavings: number;
  totalKm: number;
  monthlyTrend: number[];
}

export interface InterestNotification {
  title: string;
  body: string;
  kind?: "carrier-interest" | "driver-interest-sent" | "match-accepted";
  matchId?: string;
  loadId?: string;
}

export interface CompanyAccount {
  _id: string;
  companyName: string;
  email: string;
  password: string;
  createdAt?: string;
}

export interface CompanySession {
  token: string;
  company: Omit<CompanyAccount, "password">;
}

export type AccountRole = "company" | "driver" | "user";

export interface AuthProfile {
  _id: string;
  name: string;
  email: string;
  role: AccountRole;
  driverId?: string;
}

export interface AuthSession {
  token: string;
  profile: AuthProfile;
}

export interface Match {
  _id: string;
  driverId: string;
  loadId: string;
  carrierName: string;
  status: "Interesse do Motorista" | "Interesse enviado" | "Match Aceito";
  createdAt?: string;
  acceptedAt?: string;
 }

export interface DriverRegistrationPayload {
  fullName: string;
  email: string;
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
}

export interface LoadRegistrationPayload {
  shipperName: string;
  cargoDescription: string;
  cargoType: CargoType;
  freightValue: number;
  originPoint: string;
  destinationPoint: string;
  destinationCity: string;
  destinationState: string;
  distanceKm: number;
  requiredCertifications: string[];
  immediateNeed: boolean;
}