import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import multer from "multer";
import { Server } from "socket.io";
import nodemailer from "nodemailer";
import { MongoClient, ObjectId } from "mongodb";

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB = process.env.MONGODB_DB || "hubmotoristas";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const upload = multer({ storage: multer.memoryStorage() });

const seededDriverProfile = {
  _id: "drv-1001",
  fullName: "Carlos Henrique Silva",
  email: "motorista@hubmotoristas.com.br",
  phone: "(31) 99999-1001",
  cpf: "123.456.789-00",
  rg: "MG-12.345.678",
  photoUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Carlos%20Henrique%20Silva",
  anttRegistry: "ANTT-457812",
  cargoTypes: ["Siderurgicos", "Minerio de Ferro"],
  cep: "30140-110",
  street: "Av. Afonso Pena",
  district: "Centro",
  city: "Belo Horizonte",
  state: "MG",
  region: "Sudeste",
  experienceYears: 9,
  certifications: ["MOPP", "Direcao Defensiva"],
  cnhFileName: "cnh-carlos.pdf",
  statusPgr: "Homologado",
  verifiedSeal: true,
  rating: 4.9,
  completedTrips: 412,
  accidentIncidentIndex: 0.4,
  punctualityScore: 99.2,
  routeComplianceScore: 98.8,
  trafficFines: 1,
  customerServiceScore: 9.6,
  stressResistanceScore: 9.1,
  commitmentScore: 9.4,
  defensiveDrivingLevel: 9.7,
  createdAt: new Date(),
};

const seededCompanyAccount = {
  _id: "cmp-1001",
  companyName: "Atlas Cargas Integradas",
  email: "transportadora@hubmotoristas.com.br",
  password: "Transp@123",
  createdAt: new Date(),
};

const memoryDb = {
  companies: [seededCompanyAccount],
  users: [],
  drivers: [seededDriverProfile],
  driverAccounts: [
    {
      _id: "dacc-1001",
      driverId: seededDriverProfile._id,
      name: seededDriverProfile.fullName,
      email: seededDriverProfile.email,
      password: "Motorista@123",
      createdAt: new Date(),
    },
  ],
  loads: [],
  matches: [],
};

let mongoClient = null;
let mongoDb = null;

app.use(cors());
app.use(express.json());

const mailer = nodemailer.createTransport({
  jsonTransport: true,
});

async function connectMongo() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB);
    console.log(`[mongo] conectado em ${MONGODB_URI}/${MONGODB_DB}`);
  } catch (error) {
    mongoDb = null;
    console.warn("[mongo] nao conectado, usando armazenamento em memoria", error.message);
  }
}

function generateId() {
  return new ObjectId().toHexString();
}

function emailExistsInAnyAccount(email, except = {}) {
  return Boolean(
    memoryDb.companies.find((item) => item.email === email && !(except.role === "company" && except.id === item._id)) ||
      memoryDb.users.find((item) => item.email === email && !(except.role === "user" && except.id === item._id)) ||
      memoryDb.driverAccounts.find((item) => item.email === email && !(except.role === "driver" && except.id === item._id))
  );
}

function mapSessionProfile(profile) {
  return {
    _id: profile._id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    driverId: profile.driverId,
  };
}

async function insertDriver(driver) {
  if (mongoDb) {
    const result = await mongoDb.collection("drivers").insertOne(driver);
    return { ...driver, _id: result.insertedId.toHexString() };
  }

  memoryDb.drivers.push(driver);
  return driver;
}

async function listDrivers(filter = {}) {
  if (mongoDb) {
    return mongoDb.collection("drivers").find(filter).toArray();
  }

  return memoryDb.drivers.filter((driver) => {
    return Object.entries(filter).every(([key, value]) => {
      if (Array.isArray(driver[key])) {
        return driver[key].includes(value);
      }
      return driver[key] === value;
    });
  });
}

async function updateDriver(driverId, patch) {
  if (mongoDb) {
    await mongoDb
      .collection("drivers")
      .updateOne({ _id: new ObjectId(driverId) }, { $set: patch });
    return mongoDb.collection("drivers").findOne({ _id: new ObjectId(driverId) });
  }

  const index = memoryDb.drivers.findIndex((driver) => driver._id === driverId);
  if (index === -1) {
    return null;
  }

  memoryDb.drivers[index] = { ...memoryDb.drivers[index], ...patch };
  return memoryDb.drivers[index];
}

io.on("connection", (socket) => {
  const { userId, role } = socket.handshake.query;
  if (userId) {
    socket.join(String(userId));
  }

  socket.emit("connected", {
    message: "Canal de notificacoes em tempo real ativo.",
    role,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, realtime: true, mongoConnected: Boolean(mongoDb) });
});

app.post("/api/companies/register", (req, res) => {
  const { companyName, email, password } = req.body;
  if (!companyName || !email || !password) {
    return res.status(400).json({ error: "Nome da transportadora, e-mail e senha sao obrigatorios." });
  }

  if (emailExistsInAnyAccount(email)) {
    return res.status(409).json({ error: "Ja existe conta cadastrada com este e-mail." });
  }

  const company = {
    _id: generateId(),
    companyName,
    email,
    password,
    createdAt: new Date(),
  };

  memoryDb.companies.push(company);
  return res.status(201).json({
    token: `company-${company._id}`,
    profile: mapSessionProfile({
      _id: company._id,
      name: company.companyName,
      email: company.email,
      role: "company",
    }),
  });
});

app.post("/api/users/register", (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Nome completo, e-mail e senha sao obrigatorios." });
  }

  if (emailExistsInAnyAccount(email)) {
    return res.status(409).json({ error: "Ja existe conta cadastrada com este e-mail." });
  }

  const user = {
    _id: generateId(),
    fullName,
    email,
    password,
    createdAt: new Date(),
  };
  memoryDb.users.push(user);

  return res.status(201).json({
    token: `user-${user._id}`,
    profile: mapSessionProfile({
      _id: user._id,
      name: user.fullName,
      email: user.email,
      role: "user",
    }),
  });
});

app.post("/api/companies/login", (req, res) => {
  const { email, password } = req.body;
  const company = memoryDb.companies.find((item) => item.email === email && item.password === password);

  if (!company) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  return res.json({
    token: `company-${company._id}`,
    profile: mapSessionProfile({
      _id: company._id,
      name: company.companyName,
      email: company.email,
      role: "company",
    }),
  });
});

app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;
  const user = memoryDb.users.find((item) => item.email === email && item.password === password);

  if (!user) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  return res.json({
    token: `user-${user._id}`,
    profile: mapSessionProfile({
      _id: user._id,
      name: user.fullName,
      email: user.email,
      role: "user",
    }),
  });
});

app.post("/api/drivers/login", (req, res) => {
  const { email, password } = req.body;
  const account = memoryDb.driverAccounts.find((item) => item.email === email && item.password === password);

  if (!account) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  return res.json({
    token: `driver-${account._id}`,
    profile: mapSessionProfile({
      _id: account._id,
      name: account.name,
      email: account.email,
      role: "driver",
      driverId: account.driverId,
    }),
  });
});

app.post("/api/auth/recover-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ registered: false, message: "E-mail nao informado." });
  }

  const account =
    memoryDb.companies.find((item) => item.email === email) ||
    memoryDb.users.find((item) => item.email === email) ||
    memoryDb.driverAccounts.find((item) => item.email === email);
  if (!account) {
    return res.json({ registered: false, message: "E-mail não cadastrado" });
  }

  return res.json({
    registered: true,
    message: "Solicitacao recebida. As instrucoes de recuperacao foram enviadas para seu e-mail.",
  });
});

app.put("/api/profile", (req, res) => {
  const { role, id, name, email, password } = req.body;
  if (!role || !id || !email) {
    return res.status(400).json({ error: "role, id e e-mail sao obrigatorios." });
  }

  if (emailExistsInAnyAccount(email, { role, id })) {
    return res.status(409).json({ error: "Ja existe conta com este e-mail." });
  }

  if (role === "company") {
    const index = memoryDb.companies.findIndex((item) => item._id === id);
    if (index === -1) return res.status(404).json({ error: "Conta nao encontrada." });
    memoryDb.companies[index] = {
      ...memoryDb.companies[index],
      email,
      password: password || memoryDb.companies[index].password,
    };
    return res.json({
      profile: mapSessionProfile({ _id: id, name: memoryDb.companies[index].companyName, email, role: "company" }),
    });
  }

  if (role === "user") {
    const index = memoryDb.users.findIndex((item) => item._id === id);
    if (index === -1) return res.status(404).json({ error: "Conta nao encontrada." });
    memoryDb.users[index] = {
      ...memoryDb.users[index],
      email,
      password: password || memoryDb.users[index].password,
    };
    return res.json({
      profile: mapSessionProfile({ _id: id, name: memoryDb.users[index].fullName, email, role: "user" }),
    });
  }

  if (role === "driver") {
    const accountIndex = memoryDb.driverAccounts.findIndex((item) => item._id === id);
    if (accountIndex === -1) return res.status(404).json({ error: "Conta nao encontrada." });

    const account = memoryDb.driverAccounts[accountIndex];
    const driverData = req.body.driverData || {};
    memoryDb.driverAccounts[accountIndex] = {
      ...account,
      email,
      password: password || account.password,
    };

    const driverIndex = memoryDb.drivers.findIndex((item) => item._id === account.driverId);
    if (driverIndex !== -1) {
      memoryDb.drivers[driverIndex] = {
        ...memoryDb.drivers[driverIndex],
        email,
        phone: driverData.phone || memoryDb.drivers[driverIndex].phone || "",
        cpf: driverData.cpf || memoryDb.drivers[driverIndex].cpf,
        rg: driverData.rg || memoryDb.drivers[driverIndex].rg,
        cep: driverData.cep || memoryDb.drivers[driverIndex].cep || "",
        street: driverData.street || memoryDb.drivers[driverIndex].street || "",
        district: driverData.district || memoryDb.drivers[driverIndex].district || "",
        city: driverData.city || memoryDb.drivers[driverIndex].city,
        state: driverData.state || memoryDb.drivers[driverIndex].state,
        region: driverData.region || memoryDb.drivers[driverIndex].region,
        experienceYears: Number(driverData.experienceYears || memoryDb.drivers[driverIndex].experienceYears || 0),
        cargoTypes: Array.isArray(driverData.cargoTypes) ? driverData.cargoTypes : memoryDb.drivers[driverIndex].cargoTypes,
        certifications: Array.isArray(driverData.certifications)
          ? driverData.certifications
          : memoryDb.drivers[driverIndex].certifications,
        cnhFileName: driverData.cnhFileName || memoryDb.drivers[driverIndex].cnhFileName || "",
      };
    }

    return res.json({
      profile: mapSessionProfile({ _id: id, name: account.name, email, role: "driver", driverId: account.driverId }),
    });
  }

  return res.status(400).json({ error: "Role invalido." });
});

app.post("/api/drivers", upload.single("cnhFile"), async (req, res) => {
  const body = req.body;
  const cnhFileName = req.file?.originalname || body.cnhFileName;

  if (!body.cpf || !body.rg || !cnhFileName) {
    return res.status(400).json({
      error: "CPF, RG e upload da CNH sao obrigatorios para homologacao PGR.",
    });
  }

  const driver = {
    _id: generateId(),
    fullName: body.fullName,
    email: body.email,
    phone: body.phone,
    cpf: body.cpf,
    rg: body.rg,
    photoUrl: body.photoUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(body.fullName || "motorista")}`,
    anttRegistry: body.anttRegistry || `ANTT-${String(generateId()).slice(-6).toUpperCase()}`,
    cargoTypes: body.cargoTypes || [],
    cep: body.cep,
    street: body.street,
    district: body.district,
    city: body.city,
    state: body.state,
    region: body.region,
    experienceYears: Number(body.experienceYears || 0),
    certifications: body.certifications || [],
    cnhFileName,
    statusPgr: "Em Analise de PGR",
    verifiedSeal: false,
    rating: Number(body.rating || (4 + Math.random()).toFixed(1)),
    completedTrips: Number(body.completedTrips || Math.floor(Math.random() * 120 + 10)),
    accidentIncidentIndex: Number(body.accidentIncidentIndex || (Math.random() * 3).toFixed(2)),
    punctualityScore: Number(body.punctualityScore || (94 + Math.random() * 5).toFixed(1)),
    routeComplianceScore: Number(body.routeComplianceScore || (93 + Math.random() * 6).toFixed(1)),
    trafficFines: Number(body.trafficFines || Math.floor(Math.random() * 3)),
    customerServiceScore: Number(body.customerServiceScore || (8 + Math.random() * 2).toFixed(1)),
    stressResistanceScore: Number(body.stressResistanceScore || (7.5 + Math.random() * 2.5).toFixed(1)),
    commitmentScore: Number(body.commitmentScore || (8 + Math.random() * 2).toFixed(1)),
    defensiveDrivingLevel: Number(body.defensiveDrivingLevel || (8 + Math.random() * 2).toFixed(1)),
    createdAt: new Date(),
  };

  const createdDriver = await insertDriver(driver);

  if (driver.email) {
    await mailer.sendMail({
      from: "Hubmotoristas <noreply@hubmotoristas.com.br>",
      to: driver.email,
      subject: "Cadastro recebido - Hubmotoristas.com.br",
      text: `Seu cadastro foi recebido e esta ${driver.statusPgr}. Avisaremos apos a homologacao.`,
    });
  }

  return res.status(201).json(createdDriver);
});

app.post("/api/drivers/:id/pgr-validate", async (req, res) => {
  const updatedDriver = await updateDriver(req.params.id, {
    statusPgr: "Homologado",
    verifiedSeal: true,
    homologatedAt: new Date(),
  });

  if (!updatedDriver) {
    return res.status(404).json({ error: "Motorista nao encontrado." });
  }

  return res.json(updatedDriver);
});

app.get("/api/drivers", async (req, res) => {
  const { cargoType, region, state, city, immediate, minRating = "0", minTrips = "0" } = req.query;

  const drivers = await listDrivers();
  const filteredDrivers = drivers
    .filter((driver) => {
      if (cargoType && !driver.cargoTypes.includes(cargoType)) return false;
      if (region && driver.region !== region) return false;
      if (state && driver.state !== state) return false;
      if (city && driver.city !== city) return false;
      if (immediate === "true" && driver.statusPgr !== "Homologado") return false;
      if (Number(driver.rating || 0) < Number(minRating)) return false;
      if (Number(driver.completedTrips || 0) < Number(minTrips)) return false;
      return true;
    })
    .sort((a, b) => {
      const scoreA = Number(a.rating || 0) * 100 + Number(a.completedTrips || 0);
      const scoreB = Number(b.rating || 0) * 100 + Number(b.completedTrips || 0);
      return scoreB - scoreA;
    });

  return res.json(filteredDrivers);
});

app.post("/api/loads", (req, res) => {
  if (!req.body.shipperName || !req.body.cargoType || !req.body.originPoint || !req.body.destinationPoint) {
    return res.status(400).json({
      error: "Empresa, tipo de carga, ponto de partida e ponto de chegada sao obrigatorios.",
    });
  }

  const load = {
    _id: generateId(),
    shipperName: req.body.shipperName,
    cargoDescription: req.body.cargoDescription,
    cargoType: req.body.cargoType,
    freightValue: Number(req.body.freightValue),
    originPoint: req.body.originPoint,
    destinationPoint: req.body.destinationPoint,
    destinationCity: req.body.destinationCity,
    destinationState: req.body.destinationState,
    distanceKm: Number(req.body.distanceKm),
    requiredCertifications: req.body.requiredCertifications || [],
    immediateNeed: Boolean(req.body.immediateNeed),
    createdAt: new Date(),
  };

  memoryDb.loads.push(load);
  res.status(201).json(load);
});

app.get("/api/loads", (_req, res) => {
  res.json(memoryDb.loads);
});

app.get("/api/shipper/bi", (_req, res) => {
  res.json({
    deliveryEffectiveness: 99.4,
    freightSavings: 12.8,
    totalKm: 1278450,
    monthlyTrend: [95.8, 97.4, 98.1, 99.4],
  });
});

app.post("/api/documents/release", (req, res) => {
  res.json({
    released: true,
    message: `Documentos fiscais liberados para o match ${req.body.matchId || "manual"} em ate 1 hora.`,
  });
});

app.post("/api/matches/interest", (req, res) => {
  const match = {
    _id: generateId(),
    driverId: req.body.driverId,
    loadId: req.body.loadId,
    carrierName: req.body.carrierName || "Transportadora Parceira",
    status: "Interesse enviado",
    createdAt: new Date(),
  };

  memoryDb.matches.push(match);
  io.to(String(match.driverId)).emit("carrier-interest", {
    title: `A transportadora ${match.carrierName} demonstrou interesse!`,
    body: "Liberacao de documentos disponivel.",
    match,
  });

  res.status(201).json(match);
});

app.post("/api/matches/driver-interest", (req, res) => {
  if (!req.body.driverId || !req.body.loadId) {
    return res.status(400).json({ error: "driverId e loadId sao obrigatorios." });
  }

  const match = {
    _id: generateId(),
    driverId: req.body.driverId,
    loadId: req.body.loadId,
    carrierName: req.body.carrierName || "Transportadora Parceira",
    status: "Interesse do Motorista",
    createdAt: new Date(),
  };

  memoryDb.matches.push(match);
  return res.status(201).json(match);
});

app.get("/api/matches", (req, res) => {
  const status = req.query.status;
  const matches = status ? memoryDb.matches.filter((item) => item.status === status) : memoryDb.matches;
  return res.json(matches);
});

app.post("/api/matches/:id/accept", (req, res) => {
  const matchIndex = memoryDb.matches.findIndex((item) => item._id === req.params.id);
  if (matchIndex === -1) {
    return res.status(404).json({ error: "Match nao encontrado." });
  }

  const acceptedMatch = {
    ...memoryDb.matches[matchIndex],
    status: "Match Aceito",
    acceptedAt: new Date(),
  };
  memoryDb.matches[matchIndex] = acceptedMatch;

  io.to(String(acceptedMatch.driverId)).emit("carrier-interest", {
    title: `A transportadora ${acceptedMatch.carrierName} aceitou seu interesse!`,
    body: "Match em ambas as partes confirmado. Voce ja pode buscar a carga.",
    kind: "match-accepted",
    matchId: acceptedMatch._id,
    loadId: acceptedMatch.loadId,
  });

  return res.json(acceptedMatch);
});

async function start() {
  await connectMongo();
  server.listen(PORT, () => {
    console.log(`[server] Hubmotoristas API online em http://localhost:${PORT}`);
  });
}

start();