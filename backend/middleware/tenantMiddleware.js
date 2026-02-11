import Store from "../models/storeModel.js";

const tenantMiddleware = async (req, res, next) => {
  let subdomain;
  let hostWithoutPort;

  const xSubdomain = req.headers["x-subdomain"] || req.headers["X-Subdomain"];

  if (xSubdomain) {
    subdomain = xSubdomain.toLowerCase().trim();
    const host =
      req.headers["x-forwarded-host"] ||
      req.headers["X-Forwarded-Host"] ||
      req.headers.host ||
      "";
    hostWithoutPort = host.split(":")[0];
  } else {
    const host =
      req.headers["x-forwarded-host"] ||
      req.headers["X-Forwarded-Host"] ||
      req.headers.host ||
      "";
    hostWithoutPort = host.split(":")[0];

    if (hostWithoutPort.includes(".")) {
      subdomain = hostWithoutPort.split(".")[0].toLowerCase();
    } else {
      subdomain = hostWithoutPort.toLowerCase();
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Tenant Middleware Debug:", {
      "x-subdomain": req.headers["x-subdomain"] || req.headers["X-Subdomain"],
      "x-forwarded-host":
        req.headers["x-forwarded-host"] || req.headers["X-Forwarded-Host"],
      host: req.headers.host,
      "extracted-subdomain": subdomain,
      url: req.originalUrl,
    });
  }

  const reservedSubdomains = ["www", "app", "admin", "myapp", "127"];

  const isPlainLocalhost =
    hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1";

  if (reservedSubdomains.includes(subdomain) || isPlainLocalhost) {
    req.isMainPlatform = true;
    req.storeId = null;
    return next();
  }

  const store = await Store.findOne({ subdomain });

  if (req.originalUrl.startsWith("/api/stores") && req.method === "POST") {
    if (!store) {
      req.isMainPlatform = true;
      req.storeId = null;
      return next();
    }
  }

  if (req.originalUrl === "/api/users" && req.method === "POST") {
    if (!store) {
      req.isMainPlatform = true;
      req.storeId = null;
      return next();
    } else {
      req.store = store;
      req.storeId = store._id;
      return next();
    }
  }

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  req.store = store;
  req.storeId = store._id;

  next();
};

export default tenantMiddleware;
