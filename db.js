const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const defaultData = {
  users: [
    {
      id: "admin-001",
      fullName: "System Administrator",
      email: "admin@traffic.crs.gov.ng",
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString()
    }
  ],
  intersections: [
    { id: "int-01", name: "Marian Junction", location: "Calabar", approaches: 4, status: "active" },
    { id: "int-02", name: "Watt Market Roundabout", location: "Calabar", approaches: 4, status: "active" },
    { id: "int-03", name: "Parliamentary Junction", location: "Calabar", approaches: 3, status: "active" },
    { id: "int-04", name: "Ikom Town Junction", location: "Ikom", approaches: 4, status: "active" },
    { id: "int-05", name: "Ogoja Central", location: "Ogoja", approaches: 3, status: "active" },
    { id: "int-06", name: "Ugep Main Road", location: "Yakurr", approaches: 4, status: "active" }
  ],
  history: []
};

function uuid() {
  return crypto.randomUUID();
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const data = JSON.parse(raw);
    let changed = false;
    if (!data.users || !data.users.some((u) => u.role === "admin")) {
      data.users = data.users || [];
      data.users.unshift(defaultData.users[0]);
      changed = true;
    }
    if (!data.intersections || data.intersections.length === 0) {
      data.intersections = JSON.parse(JSON.stringify(defaultData.intersections));
      changed = true;
    }
    if (!data.history) {
      data.history = [];
      changed = true;
    }
    if (changed) save(data);
    return data;
  } catch (e) {
    console.error("DB load error, resetting:", e.message);
    save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function save(data) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

/* ---------- Users ---------- */
function getUsers() {
  return load().users;
}

function findUserByEmail(email) {
  return load().users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
}

function findUserById(id) {
  return load().users.find((u) => u.id === id);
}

function createUser({ fullName, email, password, role }) {
  const data = load();
  if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already registered");
  }
  const user = {
    id: uuid(),
    fullName,
    email: email.toLowerCase(),
    password,
    role: role || "operator",
    createdAt: new Date().toISOString()
  };
  data.users.push(user);
  save(data);
  const { password: _, ...safe } = user;
  return safe;
}

function deleteUser(id) {
  const data = load();
  const user = data.users.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  if (user.role === "admin") throw new Error("Cannot delete admin");
  data.users = data.users.filter((u) => u.id !== id);
  save(data);
  return true;
}

/* ---------- Intersections ---------- */
function getIntersections() {
  return load().intersections;
}

function createIntersection({ name, location, approaches }) {
  const data = load();
  const item = {
    id: uuid(),
    name,
    location,
    approaches: Number(approaches) || 4,
    status: "active"
  };
  data.intersections.push(item);
  save(data);
  return item;
}

function updateIntersection(id, body) {
  const data = load();
  const idx = data.intersections.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Intersection not found");
  const item = data.intersections[idx];
  if (body.name !== undefined) item.name = body.name;
  if (body.location !== undefined) item.location = body.location;
  if (body.approaches !== undefined) item.approaches = Number(body.approaches);
  if (body.status !== undefined) item.status = body.status;
  save(data);
  return item;
}

function deleteIntersection(id) {
  const data = load();
  const before = data.intersections.length;
  data.intersections = data.intersections.filter((i) => i.id !== id);
  if (data.intersections.length === before) throw new Error("Intersection not found");
  save(data);
  return true;
}

/* ---------- History ---------- */
function getHistory(filter = {}) {
  let list = load().history;
  if (filter.userId) {
    list = list.filter((h) => h.userId === filter.userId);
  }
  return list;
}

function addHistoryEntry(entry) {
  const data = load();
  const record = {
    id: uuid(),
    userId: entry.userId,
    userName: entry.userName || "",
    intersectionId: entry.intersectionId,
    intersectionName: entry.intersectionName || "",
    approach: entry.approach,
    density: Number(entry.density),
    waitingTime: Number(entry.waitingTime),
    greenDuration: Number(entry.greenDuration),
    timestamp: new Date().toISOString()
  };
  data.history.unshift(record);
  if (data.history.length > 500) data.history.length = 500;
  save(data);
  return record;
}

function getStats() {
  const data = load();
  const operators = data.users.filter((u) => u.role === "operator");
  const history = data.history;
  const avgGreen =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.greenDuration, 0) / history.length)
      : 0;
  return {
    intersections: data.intersections.length,
    operators: operators.length,
    decisions: history.length,
    avgGreen
  };
}

module.exports = {
  getUsers,
  findUserByEmail,
  findUserById,
  createUser,
  deleteUser,
  getIntersections,
  createIntersection,
  updateIntersection,
  deleteIntersection,
  getHistory,
  addHistoryEntry,
  getStats
};
