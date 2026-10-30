require("dotenv").config();

const bcrypt = require("bcryptjs");
const { MongoStore } = require("connect-mongo");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const session = require("express-session");
const helmet = require("helmet");
const path = require("node:path");

const database = require("./db");


const app = express();
const port = Number(process.env.PORT || 3010);
const configuredSessionSecret = process.env.SESSION_SECRET;
const projectDirectory = __dirname;
const publicDirectory = path.join(projectDirectory, "public");
const isProduction = process.env.NODE_ENV === "production";
const sessionCookieName = "textify.sid";
const sessionCookieOptions = {
    httpOnly: true,
    secure: isProduction ? "auto" : false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
};
const clearSessionCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
};

// TEMP DIAGNOSTIC: allow the Vercel function to load so /api/diagnostics can
// report which production settings are missing. Restore the throws afterwards.
if (isProduction && (!configuredSessionSecret || configuredSessionSecret.length < 32)) {
    console.warn("TEMP DIAGNOSTIC: SESSION_SECRET is missing or shorter than 32 characters.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
}

if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
}

const sessionSecret = configuredSessionSecret?.length >= 32
    ? configuredSessionSecret
    : "textify-local-development-session-secret";

let sessionStore = null;

// The Mongo session store can only be built once the database connection is open.
// This proxy hands every call over to the real store as soon as it exists.
class LazySessionStore extends session.Store {
    constructor(resolveStore) {
        super();
        this.resolveStore = resolveStore;
    }

    async withStore(callback, fallback) {
        try {
            const store = await this.resolveStore();
            if (!store) {
                fallback();
                return;
            }

            callback(store);
        } catch (error) {
            fallback(error);
        }
    }

    get(sid, callback) {
        this.withStore((store) => store.get(sid, callback), callback);
    }

    set(sid, sessionData, callback) {
        this.withStore((store) => store.set(sid, sessionData, callback), callback);
    }

    destroy(sid, callback) {
        this.withStore((store) => store.destroy(sid, callback), callback);
    }

    touch(sid, sessionData, callback) {
        this.withStore((store) => store.touch(sid, sessionData, callback), callback);
    }
}

if (sessionSecret !== configuredSessionSecret) {
    console.warn("SESSION_SECRET is missing or too short. Using a development-only session secret.");
}

app.disable("x-powered-by");
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'wasm-unsafe-eval'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "blob:", "data:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://*.jsdelivr.net"],
            workerSrc: ["'self'", "blob:", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: isProduction ? [] : null
        }
    }
}));
app.use("/api/documents", express.json({ limit: "3mb" }));
app.use(express.json({ limit: "16kb" }));

// TEMP DIAGNOSTIC: remove after verifying the Vercel runtime.
app.get("/api/diagnostics", async (req, res) => {
    let init = "ok";

    try {
        await initialize();
    } catch (error) {
        init = `${error.name}: ${error.message}`;
    }

    res.set("Cache-Control", "no-store");
    res.json({
        ok: true,
        node: process.version,
        vercel: Boolean(process.env.VERCEL),
        vercelEnv: process.env.VERCEL_ENV || null,
        requireMain: require.main === module,
        env: {
            nodeEnv: process.env.NODE_ENV || null,
            mongoUri: Boolean(process.env.MONGODB_URI),
            mongoDb: process.env.MONGODB_DB || null,
            sessionSecret: Boolean(process.env.SESSION_SECRET),
            sessionSecretValid: (process.env.SESSION_SECRET || "").length >= 32,
            trustProxy: process.env.TRUST_PROXY || null
        },
        init
    });
});

// Connect to MongoDB before the session store or any route is used. This runs
// once per process (including each Vercel serverless cold start).
app.use((req, res, next) => {
    initialize().then(() => next(), next);
});

app.use(session({
    name: sessionCookieName,
    secret: sessionSecret,
    store: new LazySessionStore(() => sessionStore),
    resave: false,
    saveUninitialized: false,
    cookie: sessionCookieOptions
}));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many attempts. Please wait and try again." }
});

const documentLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many document operations. Please slow down." }
});

function publicUser(user) {
    return { id: String(user._id ?? user.id), email: user.email };
}

function normalizeEmail(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateCredentials(email, password) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return "Enter a valid email address.";
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return "Password must be between 8 and 128 characters.";
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
        return "Password must not exceed 72 UTF-8 bytes.";
    }

    return null;
}

function establishSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) {
                reject(error);
                return;
            }

            req.session.user = publicUser(user);
            req.session.save((saveError) => {
                if (saveError) {
                    reject(saveError);
                    return;
                }

                resolve();
            });
        });
    });
}

function requireAuth(req, res, next) {
    if (!req.session.user) {
        res.redirect(302, "/login");
        return;
    }

    next();
}

function requireApiAuth(req, res, next) {
    if (!req.session.user) {
        res.status(401).json({ error: "Sign in to continue." });
        return;
    }

    next();
}

function sendFile(res, fileName) {
    res.sendFile(path.join(publicDirectory, fileName));
}

app.get("/", (req, res) => {
    if (!req.session.user) {
        res.redirect(302, "/login");
        return;
    }

    res.set("Cache-Control", "no-store");
    sendFile(res, "index.html");
});

app.get("/login", (req, res) => {
    if (req.session.user) {
        res.redirect(302, "/");
        return;
    }

    res.set("Cache-Control", "no-store");
    sendFile(res, "login.html");
});

app.get("/style.css", (req, res) => sendFile(res, "style.css"));
app.get("/auth.js", (req, res) => sendFile(res, "auth.js"));
app.get("/script.js", requireAuth, (req, res) => sendFile(res, "script.js"));
app.get("/text-tools.js", requireAuth, (req, res) => sendFile(res, "text-tools.js"));
app.get("/exporters.js", requireAuth, (req, res) => sendFile(res, "exporters.js"));
app.get("/text-to-image.js", requireAuth, (req, res) => sendFile(res, "text-to-image.js"));

// Serve any remaining public assets (icons, future files). `index: false`
// keeps the authenticated "/" route in charge of the app shell.
app.use(express.static(publicDirectory, { index: false }));

app.get("/api/health", async (req, res) => {
    res.json({
        status: "ok",
        storage: database.getStorageMode(),
        sessions: database.isMongoReady() ? "mongodb" : "memory"
    });
});

app.use("/api/auth", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const validationError = validateCredentials(email, password);

    if (validationError) {
        res.status(400).json({ error: validationError });
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let user;

    try {
        user = await database.createUser(email, passwordHash);
    } catch (error) {
        if (error.code === database.DUPLICATE_EMAIL) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }

        throw error;
    }

    await establishSession(req, user);
    res.status(201).json({ user: publicUser(user) });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || typeof password !== "string" || email.length > 254
        || password.length > 128 || Buffer.byteLength(password, "utf8") > 72) {
        res.status(400).json({ error: "Enter your email and password." });
        return;
    }

    const user = await database.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        res.status(401).json({ error: "Email or password is incorrect." });
        return;
    }

    await establishSession(req, user);
    database.touchUser(user._id ?? user.id).catch(() => undefined);
    res.json({ user: publicUser(user) });
});

app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
        res.status(401).json({ error: "Sign in to continue." });
        return;
    }

    res.json({ user: req.session.user });
});

app.post("/api/auth/logout", (req, res, next) => {
    if (!req.session) {
        res.clearCookie(sessionCookieName, clearSessionCookieOptions);
        res.status(204).end();
        return;
    }

    req.session.destroy((error) => {
        if (error) {
            next(error);
            return;
        }

        res.clearCookie(sessionCookieName, clearSessionCookieOptions);
        res.status(204).end();
    });
});

app.use("/api/documents", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.get("/api/documents", requireApiAuth, async (req, res) => {
    const result = await database.listDocuments(req.session.user.id, {
        query: req.query.query,
        limit: req.query.limit,
        skip: req.query.skip,
        language: req.query.language
    });

    res.json(result);
});

app.post("/api/documents", requireApiAuth, documentLimiter, async (req, res) => {
    const body = req.body || {};

    if (typeof body.text !== "string" || !body.text.trim()) {
        res.status(400).json({ error: "The extracted text is required." });
        return;
    }

    const document = await database.createDocument(req.session.user.id, body);
    res.status(201).json({ document });
});

app.get("/api/documents/:documentId", requireApiAuth, async (req, res) => {
    const document = await database.getDocument(req.session.user.id, req.params.documentId);

    if (!document) {
        res.status(404).json({ error: "That document was not found." });
        return;
    }

    res.json({ document });
});

app.patch("/api/documents/:documentId", requireApiAuth, documentLimiter, async (req, res) => {
    const document = await database.updateDocument(req.session.user.id, req.params.documentId, req.body || {});

    if (!document) {
        res.status(404).json({ error: "That document was not found." });
        return;
    }

    res.json({ document });
});

app.delete("/api/documents/:documentId", requireApiAuth, documentLimiter, async (req, res) => {
    const deleted = await database.deleteDocument(req.session.user.id, req.params.documentId);

    if (!deleted) {
        res.status(404).json({ error: "That document was not found." });
        return;
    }

    res.status(204).end();
});

app.delete("/api/documents", requireApiAuth, documentLimiter, async (req, res) => {
    const removed = await database.deleteAllDocuments(req.session.user.id);
    res.json({ removed });
});

app.use((error, req, res, next) => {
    console.error("Request failed:", error);

    if (res.headersSent) {
        next(error);
        return;
    }

    res.status(500).json({ error: "A server error occurred. Please try again." });
});

let initializationPromise = null;

async function initialize() {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            if (isProduction && !process.env.MONGODB_URI) {
                throw new Error("MONGODB_URI is required in production.");
            }

            const connection = await database.connectDatabase();

            if (connection.mode === "mongodb") {
                sessionStore = MongoStore.create({
                    client: database.getMongoClient(),
                    dbName: process.env.MONGODB_DB || "textify",
                    collectionName: "sessions",
                    ttl: 7 * 24 * 60 * 60,
                    touchAfter: 24 * 60 * 60,
                    stringify: false,
                    timestamps: true
                });

                console.log("Sessions are stored in MongoDB.");
            } else {
                sessionStore = new session.MemoryStore();
                console.warn("Sessions use the in-memory store. Restarting the server signs everyone out.");
            }

            return connection;
        })().catch((error) => {
            // Allow the next request to retry if the database was unreachable.
            initializationPromise = null;
            throw error;
        });
    }

    return initializationPromise;
}

async function startServer() {
    const connection = await initialize();
    const server = app.listen(port, "0.0.0.0", () => {
        console.log(`Textify AI is running at http://localhost:${port} (${connection.mode} storage)`);
    });

    return server;
}

if (require.main === module && !process.env.VERCEL) {
    startServer().catch(async (error) => {
        console.error("Could not start Textify AI:", error.message);
        await database.closeDatabase();
        process.exitCode = 1;
    });
}

// Vercel imports this file and detects the exported Express app.
// Running `node server.js` still starts the normal HTTP listener.
module.exports = app;
module.exports.initialize = initialize;
