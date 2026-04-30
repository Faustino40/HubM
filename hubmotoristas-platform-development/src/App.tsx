import { useEffect, useMemo, useState } from "react";
import { DriverMatchBoard } from "./components/DriverMatchBoard";
import { DriverRegistrationForm } from "./components/DriverRegistrationForm";
import { LandingPage } from "./components/LandingPage";
import { PlatformAccess } from "./components/PlatformAccess";
import { ShipperBIDashboard } from "./components/ShipperBIDashboard";
import { SupportChat } from "./components/SupportChat"; // Este componente deve ser o seu novo Pop-up
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";
import { cargoOptions, mockDrivers } from "./data/mock";
import {
  acceptDriverInterest,
  driverExpressInterest,
  fetchBIMetrics,
  fetchDriverInterests,
  fetchDrivers,
  fetchLoads,
  loginDriver,
  loginPlatformUser,
  loginCompany,
  recoverPlatformPassword,
  registerCompany,
  registerDriver,
  registerLoad,
  registerPlatformUser,
  releaseDocs,
  requestInterest,
  updateProfile,
  updateDriverFullProfile,
} from "./services/api";
import type { AuthProfile, CargoType, Driver, InterestNotification, Load, Match, ShipperBI } from "./types";

type ViewMode = "landing" | "plataforma";
type AccessMode = "operador" | "admin";

const certificationsList = ["MOPP", "Direcao Defensiva", "NR20", "Transporte de Produtos Perigosos"];

const initialDriverProfileForm = {
  phone: "",
  cpf: "",
  rg: "",
  cep: "",
  street: "",
  district: "",
  city: "",
  state: "",
  region: "",
  experienceYears: 0,
  cargoTypes: [] as CargoType[],
  certifications: [] as string[],
  cnhFileName: "",
};

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
  const [notification, setNotification] = useState<InterestNotification | null>(null);
  const [accessMode, setAccessMode] = useState<AccessMode>("operador");
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [pendingInterests, setPendingInterests] = useState<Match[]>([]);
  const [confirmedMatch, setConfirmedMatch] = useState<Match | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [driverProfileForm, setDriverProfileForm] = useState(initialDriverProfileForm);
  const [otherDriverCargoType, setOtherDriverCargoType] = useState("");
  const [otherDriverCertification, setOtherDriverCertification] = useState("");

  useRealtimeNotifications(activeDriverId, (incoming) => {
    setNotification(incoming);
  });

  useEffect(() => {
    async function loadData() {
      const [driversResponse, loadsResponse, biResponse, interestsResponse] = await Promise.all([
        fetchDrivers(),
        fetchLoads(),
        fetchBIMetrics(),
        fetchDriverInterests(),
      ]);
      const baseDrivers = driversResponse.length > 0 ? driversResponse : mockDrivers;
      setDrivers(baseDrivers);
      setLoads(loadsResponse);
      setMetrics(biResponse);
      setPendingInterests(interestsResponse);
      if (baseDrivers[0]?._id) {
        setActiveDriverId(baseDrivers[0]._id);
      }
    }

    loadData();
  }, []);

  const activeDriver = useMemo(() => {
    return drivers.find((driver) => driver._id === activeDriverId) || drivers[0];
  }, [drivers, activeDriverId]);

  // Handlers omitidos para brevidade, mas mantidos no seu código original...
  async function handleRegisterDriver(payload: Parameters<typeof registerDriver>[0]) {
    const createdDriver = await registerDriver(payload);
    setDrivers((prev) => [createdDriver, ...prev]);
    setActiveDriverId(createdDriver._id);
    return createdDriver;
  }

  async function handleLogout() {
    setAuthProfile(null);
    setShowProfileMenu(false);
    setViewMode("landing"); // Ao deslogar, volta para a landing
  }

  // --- RENDERIZAÇÃO ---

  if (viewMode === "landing") {
    return (
      <main>
        <LandingPage
          drivers={drivers}
          onEntrar={(mode) => {
            setAccessMode(mode);
            setAuthProfile(null);
            setViewMode("plataforma");
          }}
        />
        {/* O SupportChat aqui deve ser o componente que gerencia o Pop-up do Chatbot */}
        <SupportChat />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <p className="text-lg font-bold text-blue-950">Hubmotoristas.com.br</p>
            {/* Ajuste solicitado: O hub digital entre empresas e motoristas */}
            <p className="text-xs text-slate-600 font-medium italic">O hub digital entre empresas e motoristas</p>
          </div>
          <div className="flex items-center gap-2">
            {accessMode === "operador" && authProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {authProfile.name}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                    <button onClick={() => { /* lógica de editar */ }} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
                      Editar meus dados
                    </button>
                    <button onClick={handleLogout} className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Ajuste solicitado: Ver landing -> Tela inicial */}
            <button 
              onClick={() => setViewMode("landing")} 
              className="rounded-md border border-[#FF6200] bg-white px-3 py-2 text-sm font-semibold text-[#FF6200] hover:bg-[#FF6200] hover:text-white transition"
            >
              Tela inicial
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo da Plataforma (Dashboard, Match, etc) */}
      {/* ... (mantendo sua lógica de ShipperBIDashboard e DriverMatchBoard) */}
      
      {/* Aqui chamei os componentes conforme sua lógica original */}
      <div className="py-6">
          {accessMode === "operador" && !authProfile && (
            <PlatformAccess
              onCompanyLogin={handleCompanyLogin}
              onDriverLogin={handleDriverLogin}
              onCompanyRegister={handleCompanyRegister}
              onUserLogin={handleUserLogin}
              onUserRegister={handleUserRegister}
              onRecoverPassword={handleRecoverPassword}
            />
          )}
          
          {/* ... resto do seu código de visualização ... */}
      </div>

      {/* Pop-up do Chatbot disponível em todas as telas da plataforma */}
      <SupportChat />
    </main>
  );
}
