# MongoDB Atlas Free Tier Setup Guide

Follow these steps to create a free MongoDB Atlas cluster and get your connection string.

## Step 1: Create a MongoDB Atlas Account
1. Go to [https://www.mongodb.com/atlas.com](https://www.mongodb.com/atlas.com)
2. Click "Start Free" and sign up for an account (email + password is fine)
3. Verify your email if prompted

## Step 2: Create a New Project
1. Once logged in, click "New Project"
2. Name it "Textify OCR" or similar
3. Click "Create Project"

## Step 3: Create an M0 Cluster
1. In your new project, go to "Clusters" in the left sidebar
2. Click "Create Cluster"
3. **Tier**: Select "M0" (Free Tier) - this is the forever-free tier
4. **Cloud Provider**: AWS (default) or GCP/Azure - choose whichever you prefer
5. **Region**: US East (N. Virginia) is fine for testing (`US_EAST_1`)
6. Click "Create Cluster"
7. Wait 2-3 minutes for the cluster to provision (it will show "FREE" and "M0")

## Step 4: Add Your IP to the Access List
1. Once the cluster is ready, go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (adds `0.0.0.0/0`) - this is easiest for development
   - Or click "Add Specific IP" and enter your public IP address
4. Click "Confirm"

## Step 5: Create a Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. **Username**: Choose something like `textify_user`
4. **Password**: Enter and confirm a password (e.g., `SecurePass123!`)
5. Click "Add User"
6. **Important**: Save this username/password somewhere safe - you'll need it for the connection string

## Step 6: Get Your Connection String
1. Go to "Clusters" and click "Connect" on your M0 cluster
2. Choose "Drivers" as the connection method
3. **Select your driver**: Node.js and version `6.x` or `12.x+` (your project uses Node v26, so any recent version works)
4. Click "Choose a Connection Method"
5. Under "Connect your application", you'll see the **SRV connection string**

   **Copy the full connection string shown by Atlas.** Its hostname contains your cluster name and a unique Atlas identifier, so it is not usually just `cluster0.mongodb.net`.
   ```
   mongodb+srv://textify_user:SecurePass123!@cluster0.mongodb.net
   ```

6. **Important**: Replace the password with the one you created in Step 5
7. The connection string should look like:
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.<cluster-id>.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace the username and password placeholders with your database user's credentials.
   - Keep the full hostname and query parameters provided by Atlas; do not use the example hostname literally.

## Step 7: Update Your .env File
1. Open `C:\Users\Hp\OneDrive\Desktop\Development\OCR\.env`
2. Replace the placeholder with your actual connection string:

   ```
   MONGODB_URI=mongodb+srv://textify_user:SecurePass123!@cluster0.mongodb.net
   MONGODB_DB=textify
   ```
   `MONGODB_URI` must be the full connection string copied from Atlas, including the unique cluster hostname.

3. Optionally change `SESSION_SECRET` to something more random (or keep the development one)
4. Save the file

## Step 8: Restart the Server
1. Stop the running server (Ctrl+C in the terminal)
2. Run `npm run dev` or `node server.js`
3. The server should now connect to MongoDB Atlas

   You should see these console logs (instead of the local fallback messages):
   ```
   Textify AI is running at http://localhost:3010
   MongoDB connected. Database: textify
   Sessions are stored in MongoDB.
   ```

## Verification
- Visit `http://localhost:3010/api/health` - should show `"storage":"mongodb"` instead of `"local"`
- Register a new account - should persist to MongoDB
- Create a document - should appear in the database

## Important Notes for M0 Free Tier
- M0 clusters have connection limits (typically 500 concurrent connections)
- Sleep after 60 days of inactivity (Atlas auto-pauses)
- For production, consider upgrading to M10 or higher
- Your IP access list (`0.0.0.0/0`) allows connections from anywhere

## Troubleshooting
- **"Authentication failed"**: Double-check the username/password in your connection string
- **"IP address not allowed"**: Go to Network Access and add your IP
- **"Connection timeout"**: Ensure port 443 (HTTPS) is open
- If MongoDB is unavailable during local development, the app logs a warning and uses `data/users.json`; MongoDB accounts and library entries will not be available in that mode.
- If the server starts with "MONGODB_URI is not set. Using local JSON storage": you forgot to update the `.env` file