import { useState, type FormEvent } from "react";

interface PlatformAccessProps {
  onCompanyLogin: (payload: { email: string; password: string }) => Promise<void>;
  onDriverLogin: (payload: { email: string; password: string }) => Promise<void>;
  onCompanyRegister: (payload: { companyName: string; email: string; password: string }) => Promise<void>;
  onUserLogin: (payload: { email: string; password: string }) => Promise<void>;
  onUserRegister: (payload: { fullName: string; email: string; password: string }) => Promise<void>;
  onRecoverPassword: (payload: { email: string }) => Promise<{ registered: boolean; message: string }>;
}

type AccessMode = "login" | "register-company" | "register-user" | "recover";

export function PlatformAccess({ onCompanyLogin, onDriverLogin, onCompanyRegister, onUserLogin, onUserRegister, onRecoverPassword }: PlatformAccessProps) {
  const [mode, setMode] = useState<AccessMode>("login");
  const [loginScope, setLoginScope] = useState<"company" | "driver" | "user">("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      if (mode === "login") {
        if (loginScope === "company") {
          await onCompanyLogin({ email, password });
          setStatus("Login da transportadora realizado com sucesso.");
          return;
        }

        if (loginScope === "driver") {
          await onDriverLogin({ email, password });
          setStatus("Login do motorista realizado com sucesso.");
          return;
        }

        await onUserLogin({ email, password });
        setStatus("Login do usuario realizado com sucesso.");
        return;
      }

      if (mode === "register-company") {
        await onCompanyRegister({ companyName, email, password });
        setStatus("Transportadora cadastrada. Agora voce ja pode entrar com e-mail e senha.");
        setMode("login");
        setLoginScope("company");
        setCompanyName("");
        return;
      }

      if (mode === "register-user") {
        await onUserRegister({ fullName, email, password });
        setStatus("Usuario cadastrado com sucesso. Acesso liberado para navegacao.");
        return;
      }

      const recovery = await onRecoverPassword({ email });
      setStatus(recovery.registered ? recovery.message : "E-mail não cadastrado");
    } catch {
      if (mode === "recover") {
        setStatus("Nao foi possivel validar o e-mail agora. Tente novamente.");
        return;
      }

      setStatus("Nao foi possivel concluir. Verifique os dados e tente novamente.");
    }
  }

  function switchMode(nextMode: AccessMode) {
    setMode(nextMode);
    setStatus("");
    if (nextMode === "login") {
      setPassword("");
    }
  }

  return (
    <section className="min-h-[calc(100vh-72px)] bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <h2 className="text-2xl font-semibold text-[#000B40]">Entrar na Plataforma</h2>
        <p className="mt-1 text-sm text-slate-600">Acesso restrito para login, cadastro ou recuperacao de senha.</p>
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-[#000B40] sm:text-sm">
          <p className="font-semibold">Acessos ficticios para teste</p>
          <p>Transportadora: transportadora@hubmotoristas.com.br | Senha: Transp@123</p>
          <p>Motorista: motorista@hubmotoristas.com.br | Senha: Motorista@123</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => switchMode("login")}
            className={`rounded-md px-3 py-2 text-xs font-semibold sm:text-sm ${
              mode === "login" ? "bg-[#000B40] text-white" : "border border-slate-300 text-slate-700"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => switchMode("register-company")}
            className={`rounded-md px-3 py-2 text-xs font-semibold sm:text-sm ${
              mode === "register-company" ? "bg-[#000B40] text-white" : "border border-slate-300 text-slate-700"
            }`}
          >
            Cadastro da Transportadora
          </button>
          <button
            onClick={() => switchMode("register-user")}
            className={`rounded-md px-3 py-2 text-xs font-semibold sm:text-sm ${
              mode === "register-user" ? "bg-[#000B40] text-white" : "border border-slate-300 text-slate-700"
            }`}
          >
            Cadastrar novo usuario
          </button>
          <button
            onClick={() => switchMode("recover")}
            className={`rounded-md px-3 py-2 text-xs font-semibold sm:text-sm ${
              mode === "recover" ? "bg-slate-800 text-white" : "border border-slate-300 text-slate-700"
            }`}
          >
            Recuperar senha
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4">
          {mode === "login" && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLoginScope("company")}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  loginScope === "company" ? "bg-[#000B40] text-white" : "border border-slate-300 text-slate-700"
                }`}
              >
                Login transportadora
              </button>
              <button
                type="button"
                onClick={() => setLoginScope("driver")}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  loginScope === "driver" ? "bg-[#000B40] text-white" : "border border-slate-300 text-slate-700"
                }`}
              >
                Login motorista
              </button>
              <button
                type="button"
                onClick={() => setLoginScope("user")}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  loginScope === "user" ? "bg-[#000B40] text-white" : "border border-slate-300 text-slate-700"
                }`}
              >
                Login usuario
              </button>
            </div>
          )}

          {mode === "register-company" && (
            <input
              required
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nome da transportadora"
            />
          )}

          {mode === "register-user" && (
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nome completo"
            />
          )}

          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="E-mail"
          />

          {mode !== "recover" && (
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Senha"
            />
          )}

          <button type="submit" className="rounded-md bg-[#000B40] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3B85FA]">
            {mode === "login" && "Entrar"}
            {mode === "register-company" && "Cadastrar transportadora"}
            {mode === "register-user" && "Cadastrar usuario"}
            {mode === "recover" && "Recuperar senha"}
          </button>
        </form>

        {status && <p className="mt-3 text-sm font-medium text-slate-700">{status}</p>}
      </div>
    </section>
  );
}