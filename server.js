const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const db = require("./db");

const PORT = process.env.PORT || 5000;
const PUBLIC = path.join(__dirname, "..", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json"
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC, pathname === "/" ? "index.html" : pathname);
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleApi(req, res, pathname, searchParams) {
  const method = req.method;

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  try {
    // POST /api/register
    if (method === "POST" && pathname === "/api/register") {
      const body = await readBody(req);
      const { fullName, email, password } = body;
      if (!fullName || !email || !password) {
        return sendJson(res, 400, { error: "Name, email and password are required" });
      }
      if (password.length < 6) {
        return sendJson(res, 400, { error: "Password must be at least 6 characters" });
      }
      const user = db.createUser({ fullName, email, password, role: "operator" });
      return sendJson(res, 201, { message: "Account created", user });
    }

    // POST /api/login
    if (method === "POST" && pathname === "/api/login") {
      const body = await readBody(req);
      const { email, password } = body;
      if (!email || !password) {
        return sendJson(res, 400, { error: "Email and password required" });
      }
      const user = db.findUserByEmail(email);
      if (!user || user.password !== password) {
        return sendJson(res, 401, { error: "Invalid email or password" });
      }
      const { password: _, ...safe } = user;
      return sendJson(res, 200, { user: safe });
    }

    // GET /api/stats
    if (method === "GET" && pathname === "/api/stats") {
      return sendJson(res, 200, db.getStats());
    }

    // GET /api/users  (operators only for admin)
    if (method === "GET" && pathname === "/api/users") {
      const users = db
        .getUsers()
        .filter((u) => u.role === "operator")
        .map(({ password, ...u }) => u);
      return sendJson(res, 200, users);
    }

    // POST /api/users  (admin create operator)
    if (method === "POST" && pathname === "/api/users") {
      const body = await readBody(req);
      const { fullName, email, password } = body;
      if (!fullName || !email || !password) {
        return sendJson(res, 400, { error: "Name, email and password are required" });
      }
      const user = db.createUser({ fullName, email, password, role: "operator" });
      return sendJson(res, 201, user);
    }

    // DELETE /api/users/:id
    if (method === "DELETE" && pathname.startsWith("/api/users/")) {
      const id = pathname.slice("/api/users/".length);
      db.deleteUser(id);
      return sendJson(res, 200, { message: "User removed" });
    }

    // GET /api/intersections
    if (method === "GET" && pathname === "/api/intersections") {
      let list = db.getIntersections();
      if (searchParams.get("active") === "1") {
        list = list.filter((i) => i.status === "active");
      }
      return sendJson(res, 200, list);
    }

    // POST /api/intersections
    if (method === "POST" && pathname === "/api/intersections") {
      const body = await readBody(req);
      if (!body.name || !body.location) {
        return sendJson(res, 400, { error: "Name and location are required" });
      }
      const item = db.createIntersection(body);
      return sendJson(res, 201, item);
    }

    // PUT /api/intersections/:id
    if (method === "PUT" && pathname.startsWith("/api/intersections/")) {
      const id = pathname.slice("/api/intersections/".length);
      const body = await readBody(req);
      const item = db.updateIntersection(id, body);
      return sendJson(res, 200, item);
    }

    // DELETE /api/intersections/:id
    if (method === "DELETE" && pathname.startsWith("/api/intersections/")) {
      const id = pathname.slice("/api/intersections/".length);
      db.deleteIntersection(id);
      return sendJson(res, 200, { message: "Intersection removed" });
    }

    // GET /api/history
    if (method === "GET" && pathname === "/api/history") {
      const filter = {};
      if (searchParams.get("userId")) filter.userId = searchParams.get("userId");
      return sendJson(res, 200, db.getHistory(filter));
    }

    // POST /api/history
    if (method === "POST" && pathname === "/api/history") {
      const body = await readBody(req);
      if (!body.userId || !body.intersectionId || body.greenDuration == null) {
        return sendJson(res, 400, { error: "userId, intersectionId and greenDuration required" });
      }
      const record = db.addHistoryEntry(body);
      return sendJson(res, 201, record);
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    sendJson(res, 400, { error: err.message || "Request failed" });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    return handleApi(req, res, pathname, url.searchParams);
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`\n  Traffic Fuzzy server running at http://127.0.0.1:${PORT}`);
  console.log(`  Admin login: admin@traffic.crs.gov.ng / admin123\n`);
});
