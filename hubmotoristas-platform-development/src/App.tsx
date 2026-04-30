import { useEffect, useMemo, useState } from "react";
import { DriverMatchBoard } from "./components/DriverMatchBoard";
import { DriverRegistrationForm } from "./components/DriverRegistrationForm";
import { LandingPage } from "./components/LandingPage";
import { PlatformAccess } from "./components/PlatformAccess";
import { ShipperBIDashboard } from "./components/ShipperBIDashboard";
import { SupportChat } from "./components/SupportChat";
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

  async function handleRegisterDriver(payload: Parameters<typeof registerDriver>[0]) {
    const createdDriver = await registerDriver(payload);
    setDrivers((prev) => [createdDriver, ...prev]);
    setActiveDriverId(createdDriver._id);
    return createdDriver;
  }

  async function handleSendInterest(driverId: string, loadId: string) {
    const load = loads.find((item) => item._id === loadId);
    await requestInterest(driverId, loadId, "Hubmotoristas Transportes");
    setNotification({
      title: "A transportadora Hubmotoristas Transportes demonstrou interesse!",
      body: `Liberacao de documentos disponivel para a carga ${load?.cargoType || "selecionada"}.`,
    });
  }

  async function handleDriverInterest(loadId: string) {
    if (!activeDriverId) return;
    const createdMatch = await driverExpressInterest(activeDriverId, loadId, "Hubmotoristas Transportes");
    setPendingInterests((prev) => [createdMatch, ...prev]);
    setNotification({
      title: "Interesse enviado para a transportadora",
      body: "Assim que houver aceite, voce vera o match confirmado e a liberacao de coleta.",
      kind: "driver-interest-sent",
      matchId: createdMatch._id,
      loadId,
    });
  }

  async function handleAcceptInterest(matchId: string) {
    const accepted = await acceptDriverInterest(matchId);
    setPendingInterests((prev) => prev.filter((item) => item._id !== matchId));
    if (accepted.driverId === activeDriverId) {
      setConfirmedMatch(accepted);
      setNotification({
        title: "Interesse aceito pela transportadora",
        body: "Match em ambas as partes confirmado. Voce ja pode buscar a carga.",
        kind: "match-accepted",
        matchId: accepted._id,
        loadId: accepted.loadId,
      });
    }
  }

  async function handleReleaseDocs(matchId: string) {
    const response = await releaseDocs(matchId);
    return response.message;
  }

  async function handleRegisterLoad(payload: Parameters<typeof registerLoad>[0]) {
    const createdLoad = await registerLoad(payload);
    setLoads((prev) => [createdLoad, ...prev]);
    return createdLoad;
  }

  async function handleCompanyRegister(payload: { companyName: string; email: string; password: string }) {
    const response = await registerCompany(payload);
    setAuthProfile(response.profile);
  }

  async function handleCompanyLogin(payload: { email: string; password: string }) {
    const response = await loginCompany(payload);
    setAuthProfile(response.profile);
  }

  async function handleDriverLogin(payload: { email: string; password: string }) {
    const response = await loginDriver(payload);
    setAuthProfile(response.profile);
    if (response.profile.driverId) {
      setActiveDriverId(response.profile.driverId);
      return;
    }
    const mappedDriver = drivers.find((driver) => driver.email.toLowerCase() === payload.email.toLowerCase());
    if (mappedDriver) setActiveDriverId(mappedDriver._id);
  }

  async function handleUserRegister(payload: { fullName: string; email: string; password: string }) {
    const response = await registerPlatformUser(payload);
    setAuthProfile(response.profile);
  }

  async function handleUserLogin(payload: { email: string; password: string }) {
    const response = await loginPlatformUser(payload);
    setAuthProfile(response.profile);
  }

  async function handleRecoverPassword(payload: { email: string }) {
    return recoverPlatformPassword(payload);
  }

  async function handleUpdateProfile() {
    if (!authProfile) return;
    try {
      const response =
        authProfile.role === "driver"
          ? await updateDriverFullProfile({
              role: "driver",
              id: authProfile._id,
              name: profileName,
              email: profileEmail,
              password: profilePassword || undefined,
              driverData: driverProfileForm,
            })
          : await updateProfile({
              role: authProfile.role,
              id: authProfile._id,
              name: profileName,
              email: profileEmail,
              password: profilePassword || undefined,
            });
      setAuthProfile(response.profile);
      if (authProfile.role === "driver" && authProfile.driverId) {
        setDrivers((prev) =>
          prev.map((driver) =>
            driver._id === authProfile.driverId
              ? {
                  ...driver,
                  ...driverProfileForm,
                  email: profileEmail,
                }
              : driver
          )
        );
      }
      setProfileStatus("Dados atualizados com sucesso.");
      setProfilePassword("");
      setShowEditProfile(false);
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Nao foi possivel atualizar os dados.");
    }
  }

  function openEditProfile() {
    if (!authProfile) return;
    setProfileName(authProfile.name);
    setProfileEmail(authProfile.email);
    setProfilePassword("");
    setProfileStatus("");
    setOtherDriverCargoType("");
    setOtherDriverCertification("");
    if (authProfile.role === "driver" && authProfile.driverId) {
      const currentDriver = drivers.find((driver) => driver._id === authProfile.driverId);
      if (currentDriver) {
        setDriverProfileForm({
          phone: currentDriver.phone || "",
          cpf: currentDriver.cpf || "",
          rg: currentDriver.rg || "",
          cep: currentDriver.cep || "",
          street: currentDriver.street || "",
          district: currentDriver.district || "",
          city: currentDriver.city || "",
          state: currentDriver.state || "",
          region: currentDriver.region || "",
          experienceYears: currentDriver.experienceYears || 0,
          cargoTypes: currentDriver.cargoTypes || [],
          certifications: currentDriver.certifications || [],
          cnhFileName: currentDriver.cnhFileName || "",
        });
      }
    } else {
      setDriverProfileForm(initialDriverProfileForm);
    }
    setShowEditProfile(true);
    setShowProfileMenu(false);
  }

  function toggleDriverCargo(cargo: CargoType) {
    setDriverProfileForm((prev) => ({
      ...prev,
      cargoTypes: prev.cargoTypes.includes(cargo) ? prev.cargoTypes.filter((item) => item !== cargo) : [...prev.cargoTypes, cargo],
    }));
  }

  function toggleDriverCertification(certification: string) {
    setDriverProfileForm((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter((item) => item !== certification)
        : [...prev.certifications, certification],
    }));
  }

  function addCustomDriverCargoType() {
    const normalized = otherDriverCargoType.trim();
    if (!normalized) return;
    const alreadyExists = driverProfileForm.cargoTypes.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (!alreadyExists) {
      setDriverProfileForm((prev) => ({ ...prev, cargoTypes: [...prev.cargoTypes, normalized] }));
    }
    setOtherDriverCargoType("");
  }

  function addCustomDriverCertification() {
    const normalized = otherDriverCertification.trim();
    if (!normalized) return;
    const alreadyExists = driverProfileForm.certifications.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (!alreadyExists) {
      setDriverProfileForm((prev) => ({ ...prev, certifications: [...prev.certifications, normalized] }));
    }
    setOtherDriverCertification("");
  }

  function handleLogout() {
    setAuthProfile(null);
    setShowProfileMenu(false);
  }

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
        <SupportChat />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <p className="text-lg font-bold text-blue-950">Hubmotoristas.com.br</p>
            <p className="text-xs text-slate-600">Transportadora Digital para match entre motoristas e embarcadores</p>
          </div>
          <div className="flex items-center gap-2">
            {accessMode === "operador" && authProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  {authProfile.name}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                    <button onClick={openEditProfile} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
                      Editar meus dados
                    </button>
                    <button onClick={handleLogout} className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setViewMode("landing")} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
              Ver landing
            </button>
          </div>
        </div>
      </header>

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
      {accessMode === "operador" && authProfile && (
        <>
          {authProfile.role !== "driver" && (
            <ShipperBIDashboard
              drivers={drivers}
              metrics={metrics}
              loads={loads}
              pendingInterests={pendingInterests}
              onSendInterest={handleSendInterest}
              onAcceptInterest={handleAcceptInterest}
              onReleaseDocs={handleReleaseDocs}
              onRegisterLoad={handleRegisterLoad}
            />
          )}
          <DriverMatchBoard
            loads={loads}
            cargoPreferences={activeDriver?.cargoTypes || []}
            driverLocation={
              activeDriver
                ? {
                    city: activeDriver.city,
                    state: activeDriver.state,
                    region: activeDriver.region,
                  }
                : undefined
            }
            notification={notification}
            confirmedMatch={confirmedMatch}
            onDriverInterest={handleDriverInterest}
          />
        </>
      )}

      {accessMode === "admin" && (
        <>
        <section className="bg-slate-100 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#000B40]">
            Modo administrador ativo. Navegacao liberada sem cadastro de motorista.
          </div>
        </section>
        <DriverRegistrationForm onSubmit={handleRegisterDriver} />
        <ShipperBIDashboard
          drivers={drivers}
          metrics={metrics}
          loads={loads}
          pendingInterests={pendingInterests}
          onSendInterest={handleSendInterest}
          onAcceptInterest={handleAcceptInterest}
          onReleaseDocs={handleReleaseDocs}
          onRegisterLoad={handleRegisterLoad}
        />
        <DriverMatchBoard
          loads={loads}
          cargoPreferences={activeDriver?.cargoTypes || []}
          driverLocation={
            activeDriver
              ? {
                  city: activeDriver.city,
                  state: activeDriver.state,
                  region: activeDriver.region,
                }
              : undefined
          }
          notification={notification}
          confirmedMatch={confirmedMatch}
          onDriverInterest={handleDriverInterest}
        />
      </>
      )}

      {showEditProfile && authProfile && (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">Editar meus dados</h3>
            <p className="mt-1 text-sm text-slate-600">Atualize seus dados cadastrais. O nome e bloqueado e nao pode ser alterado.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input
                value={profileName}
                disabled
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                placeholder="Nome"
              />
              <input
                type="email"
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="E-mail"
              />
              <input
                type="password"
                value={profilePassword}
                onChange={(event) => setProfilePassword(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Nova senha (opcional)"
              />

              {authProfile.role === "driver" && (
                <>
                  <input
                    value={driverProfileForm.phone}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Telefone"
                  />
                  <input
                    value={driverProfileForm.cpf}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, cpf: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="CPF"
                  />
                  <input
                    value={driverProfileForm.rg}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, rg: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="RG"
                  />
                  <input
                    value={driverProfileForm.cep}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, cep: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="CEP"
                  />
                  <input
                    value={driverProfileForm.street}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, street: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Rua"
                  />
                  <input
                    value={driverProfileForm.district}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, district: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Bairro"
                  />
                  <input
                    value={driverProfileForm.city}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, city: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Cidade"
                  />
                  <input
                    value={driverProfileForm.state}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, state: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Estado"
                  />
                  <input
                    value={driverProfileForm.region}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, region: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Regiao"
                  />
                  <input
                    type="number"
                    min={0}
                    value={driverProfileForm.experienceYears === 0 ? "" : driverProfileForm.experienceYears}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, experienceYears: Number(event.target.value) || 0 }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Experiencia (anos)"
                  />
                  <input
                    value={driverProfileForm.cnhFileName}
                    onChange={(event) => setDriverProfileForm((prev) => ({ ...prev, cnhFileName: event.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="CNH (arquivo)"
                  />

                  <div className="rounded-md border border-slate-200 p-2">
                    <p className="text-sm font-medium text-slate-700">Tipos de carga</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {cargoOptions.map((cargo) => (
                        <label key={cargo} className="flex items-center gap-2 text-xs text-slate-700">
                          <input type="checkbox" checked={driverProfileForm.cargoTypes.includes(cargo)} onChange={() => toggleDriverCargo(cargo)} />
                          {cargo}
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={otherDriverCargoType}
                        onChange={(event) => setOtherDriverCargoType(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                        placeholder="Outros tipos de carga"
                      />
                      <button type="button" onClick={addCustomDriverCargoType} className="rounded-md bg-[#000B40] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B85FA]">
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 p-2">
                    <p className="text-sm font-medium text-slate-700">Certificacoes</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {certificationsList.map((certification) => (
                        <label key={certification} className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={driverProfileForm.certifications.includes(certification)}
                            onChange={() => toggleDriverCertification(certification)}
                          />
                          {certification}
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={otherDriverCertification}
                        onChange={(event) => setOtherDriverCertification(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                        placeholder="Outras certificacoes"
                      />
                      <button
                        type="button"
                        onClick={addCustomDriverCertification}
                        className="rounded-md bg-[#000B40] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B85FA]"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            {profileStatus && <p className="mt-3 text-sm text-[#FF6200]">{profileStatus}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowEditProfile(false)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                Fechar
              </button>
              <button onClick={handleUpdateProfile} className="w-full rounded-md bg-[#000B40] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]">
                Salvar alteracoes
              </button>
            </div>
          </div>
        </section>
      )}

      <SupportChat />
    </main>
  );
}
