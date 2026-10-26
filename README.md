# Textify AI

Textify AI is a browser-based OCR studio with a Node.js authentication server. Local development can use file-based account storage; production should use MongoDB Atlas.

## Requirements

- Node.js 20 or newer
- MongoDB Atlas free tier (or self-hosted MongoDB)

## Run locally

On Windows, double-click `start.bat`. It installs dependencies if needed, starts the server, waits until it is ready, and opens the site in your browser. Keep the server window open while using the app.

Or install dependencies and start the app from PowerShell:

```powershell
npm install
npm run dev
```

Then open `http://localhost:3010`.

Without a `.env` file, the server uses local JSON account storage in `data/` and a development-only session secret.

### MongoDB Atlas setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign up for a free account.
2. Click **New Project** and name it (e.g., "Textify").
3. Create a **M0 cluster** (the free tier).
4. Click **Database Access** and add a new database user (choose a username/password).
5. Click **Network Access** and add your IP address to the **IP Whitelist** (or `0.0.0.0/0` to allow any IP).
6. Go to **Clusters**, click **Connect**, choose **Connect your application**, and copy the **SRV connection string**. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.example.mongodb.net
   ```
7. Create a `.env` file in the project root based on `.env.example` and set:
   - `MONGODB_URI` = the SRV connection string you copied
   - `MONGODB_DB` = the database name (e.g., `textify`)
   - `SESSION_SECRET` = a random base64url string (e.g., `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`)

### Running without MongoDB

If `MONGODB_URI` is not set, the server starts in **local JSON fallback mode**:

- Account storage uses `data/users.json`
- Sessions use an in-memory store (restarts everyone out)
- Document storage uses `data/documents.json`

This mode is suitable for development and testing only.

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

When `MONGODB_URI` is set, the server connects to MongoDB Atlas and persists users, sessions, and documents in the database. Use the complete connection string copied from Atlas, including its unique cluster hostname. If MongoDB is unavailable in development, the app logs a warning and uses local JSON accounts and in-memory sessions; MongoDB accounts and saved scans are not available in that mode. In production, MongoDB connection failures stop the server. Passwords are hashed with bcrypt; browser sessions are sent in an HTTP-only cookie. The OCR studio and its client script are served only to authenticated sessions. Do not commit `.env`.

For production, set `NODE_ENV=production` and serve the site over HTTPS. If TLS terminates at a trusted reverse proxy, set `TRUST_PROXY=1`.

OCR runs in the browser. The OCR library and selected language data are downloaded from jsDelivr the first time extraction is used. Hindi uses Tesseract's higher-accuracy trained data; it has a larger first download and is cached by the browser. Select English as well when a Hindi document also contains English text.

The **Text to image** section can render typed text or the current OCR result as a styled PNG. Choose the font, text size, image width, alignment, and colors; the preview and PNG are generated locally in the browser.