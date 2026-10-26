"use strict";

require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const { MongoClient, ObjectId } = require("mongodb");

const projectDirectory = __dirname;
const localDataDirectory = path.join(projectDirectory, "data");
const localUsersFile = path.join(localDataDirectory, "users.json");
const localDocumentsFile = path.join(localDataDirectory, "documents.json");

const DUPLICATE_EMAIL = "DUPLICATE_EMAIL";
const DUPLICATE_KEY = 11000;

const mongoUri = (process.env.MONGODB_URI || "").trim();
const mongoDbName = (process.env.MONGODB_DB || "textify").trim();
const mongoServerSelectionTimeout = Number(process.env.MONGODB_TIMEOUT_MS || 10000);

let mongoClient = null;
let mongoDatabase = null;
let usersCollection = null;
let documentsCollection = null;
let storageMode = "local";

function getStorageMode() {
    return storageMode;
}

function isMongoReady() {
    return Boolean(mongoDatabase);
}

function getMongoClient() {
    return mongoClient;
}

function toObjectId(value) {
    if (value instanceof ObjectId) {
        return value;
    }

    if (typeof value === "string" && /^[a-f\d]{24}$/i.test(value)) {
        return new ObjectId(value);
    }

    return null;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ------------------------------ local fallback ------------------------------ */

let localQueue = Promise.resolve();

async function readLocalArray(file) {
    try {
        const contents = await fs.readFile(file, "utf8");
        const parsed = JSON.parse(contents);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        throw error;
    }
}

// Serialises read-modify-write cycles so concurrent requests cannot clobber each other.
function updateLocalArray(file, mutator) {
    const task = localQueue.then(async () => {
        const values = await readLocalArray(file);
        const result = await mutator(values);
        await fs.mkdir(localDataDirectory, { recursive: true });
        await fs.writeFile(file, `${JSON.stringify(values, null, 2)}\n`);
        return result;
    });

    localQueue = task.then(() => undefined, () => undefined);
    return task;
}

/* --------------------------------- users ---------------------------------- */

async function findUserByEmail(email) {
    if (mongoDatabase) {
        return usersCollection.findOne({ email });
    }

    const users = await readLocalArray(localUsersFile);
    return users.find((user) => user.email === email) || null;
}

async function findUserById(id) {
    const objectId = toObjectId(id);

    if (mongoDatabase) {
        if (!objectId) {
            return null;
        }

        return usersCollection.findOne({ _id: objectId });
    }

    const users = await readLocalArray(localUsersFile);
    return users.find((user) => Number(user.id) === Number(id)) || null;
}

async function createUser(email, passwordHash) {
    if (mongoDatabase) {
        try {
            const now = new Date();
            const result = await usersCollection.insertOne({
                email,
                password_hash: passwordHash,
                created_at: now,
                last_seen_at: now
            });

            return {
                _id: result.insertedId,
                id: result.insertedId.toHexString(),
                email,
                password_hash: passwordHash,
                created_at: now
            };
        } catch (error) {
            if (error.code === DUPLICATE_KEY) {
                const duplicate = new Error("Duplicate email");
                duplicate.code = DUPLICATE_EMAIL;
                throw duplicate;
            }

            throw error;
        }
    }

    return updateLocalArray(localUsersFile, async (users) => {
        if (users.some((user) => user.email === email)) {
            const duplicate = new Error("Duplicate email");
            duplicate.code = DUPLICATE_EMAIL;
            throw duplicate;
        }

        const nextId = users.reduce((maxId, user) => Math.max(maxId, Number(user.id) || 0), 0) + 1;
        const user = {
            id: nextId,
            email,
            password_hash: passwordHash,
            created_at: new Date().toISOString()
        };

        users.push(user);
        return user;
    });
}

async function touchUser(id) {
    const objectId = toObjectId(id);

    if (mongoDatabase && objectId) {
        await usersCollection.updateOne({ _id: objectId }, { $set: { last_seen_at: new Date() } });
    }
}

/* -------------------------------- documents -------------------------------- */

function sanitizeDocumentInput(input) {
    const limitText = (value, limit) => (typeof value === "string" ? value.slice(0, limit) : "");
    const numberOrNull = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

    return {
        title: limitText(input?.title, 200) || "Untitled scan",
        file_name: limitText(input?.file_name, 260),
        text: limitText(input?.text, 200000),
        language: limitText(input?.language, 60) || "eng",
        confidence: numberOrNull(input?.confidence),
        char_count: numberOrNull(input?.char_count),
        word_count: numberOrNull(input?.word_count),
        thumbnail: limitText(input?.thumbnail, 400000),
        source: input?.source === "batch" ? "batch" : "single"
    };
}

async function createDocument(userId, input) {
    const payload = sanitizeDocumentInput(input);

    if (mongoDatabase) {
        const objectId = toObjectId(userId);
        if (!objectId) {
            return null;
        }

        const now = new Date();
        const result = await documentsCollection.insertOne({
            user_id: objectId,
            ...payload,
            created_at: now,
            updated_at: now
        });

        return {
            id: result.insertedId.toHexString(),
            user_id: userId,
            ...payload,
            created_at: now,
            updated_at: now
        };
    }

    return updateLocalArray(localDocumentsFile, async (documents) => {
        const nextId = documents.reduce((maxId, document) => Math.max(maxId, Number(document.id) || 0), 0) + 1;
        const now = new Date().toISOString();
        const document = {
            id: nextId,
            user_id: String(userId),
            ...payload,
            created_at: now,
            updated_at: now
        };

        documents.push(document);
        return document;
    });
}

async function listDocuments(userId, options = {}) {
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
    const skip = Math.max(Number(options.skip) || 0, 0);
    const query = typeof options.query === "string" ? options.query.trim() : "";

    if (mongoDatabase) {
        const objectId = toObjectId(userId);
        if (!objectId) {
            return { items: [], total: 0 };
        }

        const filter = { user_id: objectId };

        if (query) {
            const pattern = new RegExp(escapeRegExp(query), "i");
            filter.$or = [{ title: pattern }, { text: pattern }, { file_name: pattern }];
        }

        if (options.language) {
            filter.language = options.language;
        }

        const [items, total] = await Promise.all([
            documentsCollection.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).toArray(),
            documentsCollection.countDocuments(filter)
        ]);

        return {
            items: items.map((document) => ({ ...document, id: document._id.toHexString() })),
            total
        };
    }

    const documents = (await readLocalArray(localDocumentsFile))
        .filter((document) => String(document.user_id) === String(userId));

    const filtered = query
        ? documents.filter((document) => {
            const needle = query.toLowerCase();
            return [document.title, document.text, document.file_name]
                .some((field) => typeof field === "string" && field.toLowerCase().includes(needle));
        })
        : documents;

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
        items: filtered.slice(skip, skip + limit),
        total: filtered.length
    };
}

async function getDocument(userId, documentId) {
    if (mongoDatabase) {
        const objectId = toObjectId(documentId);
        const userObjectId = toObjectId(userId);
        if (!objectId || !userObjectId) {
            return null;
        }

        const document = await documentsCollection.findOne({ _id: objectId, user_id: userObjectId });
        return document ? { ...document, id: document._id.toHexString() } : null;
    }

    const documents = await readLocalArray(localDocumentsFile);
    return documents.find((document) => (
        String(document.id) === String(documentId) && String(document.user_id) === String(userId)
    )) || null;
}

async function updateDocument(userId, documentId, patch) {
    const allowed = {};

    if (typeof patch?.title === "string") {
        allowed.title = patch.title.slice(0, 200);
    }

    if (typeof patch?.text === "string") {
        allowed.text = patch.text.slice(0, 200000);
    }

    if (Object.keys(allowed).length === 0) {
        return getDocument(userId, documentId);
    }

    if (mongoDatabase) {
        const objectId = toObjectId(documentId);
        const userObjectId = toObjectId(userId);
        if (!objectId || !userObjectId) {
            return null;
        }

        const result = await documentsCollection.findOneAndUpdate(
            { _id: objectId, user_id: userObjectId },
            { $set: { ...allowed, updated_at: new Date() } },
            { returnDocument: "after" }
        );

        if (!result?.value) {
            return null;
        }

        return { ...result.value, id: result.value._id.toHexString() };
    }

    return updateLocalArray(localDocumentsFile, async (documents) => {
        const index = documents.findIndex((document) => (
            String(document.id) === String(documentId) && String(document.user_id) === String(userId)
        ));

        if (index === -1) {
            return null;
        }

        documents[index] = {
            ...documents[index],
            ...allowed,
            updated_at: new Date().toISOString()
        };

        return documents[index];
    });
}

async function deleteDocument(userId, documentId) {
    if (mongoDatabase) {
        const objectId = toObjectId(documentId);
        const userObjectId = toObjectId(userId);
        if (!objectId || !userObjectId) {
            return false;
        }

        const result = await documentsCollection.deleteOne({ _id: objectId, user_id: userObjectId });
        return result.deletedCount > 0;
    }

    return updateLocalArray(localDocumentsFile, async (documents) => {
        const index = documents.findIndex((document) => (
            String(document.id) === String(documentId) && String(document.user_id) === String(userId)
        ));

        if (index === -1) {
            return false;
        }

        documents.splice(index, 1);
        return true;
    });
}

async function deleteAllDocuments(userId) {
    if (mongoDatabase) {
        const userObjectId = toObjectId(userId);
        if (!userObjectId) {
            return 0;
        }

        const result = await documentsCollection.deleteMany({ user_id: userObjectId });
        return result.deletedCount || 0;
    }

    return updateLocalArray(localDocumentsFile, async (documents) => {
        let removed = 0;

        for (let index = documents.length - 1; index >= 0; index -= 1) {
            if (String(documents[index].user_id) === String(userId)) {
                documents.splice(index, 1);
                removed += 1;
            }
        }

        return removed;
    });
}

/* --------------------------------- startup --------------------------------- */

async function connectDatabase() {
    if (!mongoUri) {
        storageMode = "local";
        await fs.mkdir(localDataDirectory, { recursive: true });
        console.warn("MONGODB_URI is not set. Using local JSON storage for development.");
        return { mode: "local" };
    }

    mongoClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: mongoServerSelectionTimeout,
        appName: "textify-ocr"
    });

    try {
        await mongoClient.connect();

        mongoDatabase = mongoClient.db(mongoDbName);
        usersCollection = mongoDatabase.collection("users");
        documentsCollection = mongoDatabase.collection("documents");
        storageMode = "mongodb";

        await Promise.all([
            usersCollection.createIndex({ email: 1 }, { unique: true }),
            usersCollection.createIndex({ created_at: -1 }),
            documentsCollection.createIndex({ user_id: 1, created_at: -1 }),
            documentsCollection.createIndex({ user_id: 1, title: 1 })
        ]);
    } catch (error) {
        if (process.env.NODE_ENV === "production") {
            throw error;
        }

        console.error(
            `MongoDB is unavailable (${error.code || error.name}). `
            + "Using local JSON storage for development; MongoDB data will not be available."
        );

        try {
            await mongoClient.close();
        } catch (closeError) {
            console.error(`Could not close the MongoDB client (${closeError.code || closeError.name}).`);
        }

        mongoClient = null;
        mongoDatabase = null;
        usersCollection = null;
        documentsCollection = null;
        storageMode = "local";
        await fs.mkdir(localDataDirectory, { recursive: true });
        return { mode: "local" };
    }

    console.log(`MongoDB connected. Database: ${mongoDbName}`);
    return { mode: "mongodb", database: mongoDatabase };
}

async function closeDatabase() {
    if (mongoClient) {
        await mongoClient.close();
        mongoClient = null;
        mongoDatabase = null;
        usersCollection = null;
        documentsCollection = null;
    }
}

module.exports = {
    DUPLICATE_EMAIL,
    connectDatabase,
    closeDatabase,
    getStorageMode,
    getMongoClient,
    isMongoReady,
    findUserByEmail,
    findUserById,
    createUser,
    touchUser,
    createDocument,
    listDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
    deleteAllDocuments
};
