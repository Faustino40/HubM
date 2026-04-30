import { useState, type FormEvent } from "react";
import { cargoOptions } from "../data/mock";
import type { CargoType, Driver, DriverRegistrationPayload } from "../types";

interface DriverRegistrationFormProps {
  onSubmit: (payload: DriverRegistrationPayload) => Promise<Driver>;
}

const certificationsList = ["MOPP", "Direcao Defensiva", "NR20", "Transporte de Produtos Perigosos"];

const initialForm: DriverRegistrationPayload = {
  fullName: "",
  email: "",
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
  cargoTypes: [],
  certifications: [],
  cnhFileName: "",
};

export function DriverRegistrationForm({ onSubmit }: DriverRegistrationFormProps) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string>("");
  const [otherCargoType, setOtherCargoType] = useState("");
  const [otherCertification, setOtherCertification] = useState("");

  async function buscarCep() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (!data.erro) {
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    }
  }

  function toggleCargo(cargo: CargoType) {
    setForm((prev) => ({
      ...prev,
      cargoTypes: prev.cargoTypes.includes(cargo) ? prev.cargoTypes.filter((item) => item !== cargo) : [...prev.cargoTypes, cargo],
    }));
  }

  function toggleCertification(certification: string) {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter((item) => item !== certification)
        : [...prev.certifications, certification],
    }));
  }

  function addCustomCargoType() {
    const normalized = otherCargoType.trim();
    if (!normalized) return;
    const alreadyExists = form.cargoTypes.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (!alreadyExists) {
      setForm((prev) => ({ ...prev, cargoTypes: [...prev.cargoTypes, normalized] }));
    }
    setOtherCargoType("");
  }

  function addCustomCertification() {
    const normalized = otherCertification.trim();
    if (!normalized) return;
    const alreadyExists = form.certifications.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (!alreadyExists) {
      setForm((prev) => ({ ...prev, certifications: [...prev.certifications, normalized] }));
    }
    setOtherCertification("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const driver = await onSubmit(form);
    setStatus(`Cadastro concluido. Status de compliance: ${driver.statusPgr}.`);
    setForm(initialForm);
  }

  return (
    <section className="bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-[#000B40]">Cadastro do Motorista com Compliance</h2>
        <p className="mt-1 text-sm text-slate-600">Homologacao 100% com CPF, RG e upload de CNH para entrar em analise de PGR.</p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nome completo" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefone" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="CPF" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} placeholder="RG" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required type="file" accept=".pdf,image/*" onChange={(e) => setForm({ ...form, cnhFileName: e.target.files?.[0]?.name || "" })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />

          <div className="flex gap-2 sm:col-span-2">
            <input required value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="CEP" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={buscarCep} className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]">Buscar CEP</button>
          </div>

          <input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Rua" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Bairro" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Estado" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Regiao" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input
            required
            type="number"
            min={0}
            value={form.experienceYears === 0 ? "" : form.experienceYears}
            onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) || 0 })}
            placeholder="Tempo de experiencia (anos)"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Tipos de carga que voce transporta</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {cargoOptions.map((cargo) => (
                <label key={cargo} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  <input type="checkbox" checked={form.cargoTypes.includes(cargo)} onChange={() => toggleCargo(cargo)} />
                  {cargo}
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={otherCargoType}
                onChange={(e) => setOtherCargoType(e.target.value)}
                placeholder="Outros tipos de carga"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <button type="button" onClick={addCustomCargoType} className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]">
                Adicionar
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Certificacoes</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {certificationsList.map((certification) => (
                <label key={certification} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  <input type="checkbox" checked={form.certifications.includes(certification)} onChange={() => toggleCertification(certification)} />
                  {certification}
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={otherCertification}
                onChange={(e) => setOtherCertification(e.target.value)}
                placeholder="Outras certificacoes"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addCustomCertification}
                className="rounded-md bg-[#000B40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B85FA]"
              >
                Adicionar
              </button>
            </div>
          </div>

          <button type="submit" className="sm:col-span-2 rounded-md bg-[#000B40] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3B85FA]">
            Enviar cadastro para analise de PGR
          </button>
        </form>

        {status && <p className="mt-3 text-sm font-medium text-[#FF6200]">{status}</p>}
      </div>
    </section>
  );
}