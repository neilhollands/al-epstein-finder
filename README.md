# AI Image Generator (OpenAI)

This project lets you type a prompt and generate an image using OpenAI.

## Run locally (quick start)

1. Install Node.js (if not already installed).
   - Go to https://nodejs.org
   - Install the LTS version.

2. Open Terminal in this project folder:
   - `/Users/neilhollands/Documents/New project`

3. Install dependencies:
   - `npm install`

4. Create your environment file:
   - `cp .env.example .env`

5. Add your OpenAI API key:
   - Open `.env`
   - Replace `your_openai_api_key_here` with your real key.

6. Start the app:
   - `npm start`

7. Open the app in your browser:
   - http://localhost:3000

8. Type a prompt and click **Generate image**.

## Deploy with GitHub Pages (frontend) + Render (backend)

GitHub Pages can only host static files. Your `server.mjs` must run on another host (Render).

### Part A: Push your code to GitHub

1. Create a new empty GitHub repository (example name: `ai-image-generator`).
2. In Terminal, run:
   - `cd "/Users/neilhollands/Documents/New project"`
   - `git add .`
   - `git commit -m "Initial AI image generator app"`
   - `git branch -M main`
   - `git remote add origin https://github.com/<YOUR_USERNAME>/ai-image-generator.git`
   - `git push -u origin main`

### Part B: Deploy backend API on Render

1. Go to https://render.com and sign in with GitHub.
2. Click **New +** -> **Web Service**.
3. Select your `ai-image-generator` repo.
4. Use these settings:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variable:
   - Key: `OPENAI_API_KEY`
   - Value: your real OpenAI API key
6. Click **Create Web Service**.
7. After deploy, copy your Render URL, for example:
   - `https://ai-image-generator-xxxx.onrender.com`

### Part C: Connect frontend to backend URL

1. Edit `/src/config.js` and set:
   - `apiBaseUrl: "https://ai-image-generator-xxxx.onrender.com"`
2. Commit and push:
   - `git add src/config.js`
   - `git commit -m "Set production API URL"`
   - `git push`

### Part D: Deploy frontend on GitHub Pages

1. On GitHub, open your repo.
2. Go to **Settings** -> **Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**.
5. Wait about 1-2 minutes. Your site URL will appear in Pages settings:
   - `https://<YOUR_USERNAME>.github.io/ai-image-generator/`

### Part E: Test the live app

1. Open your GitHub Pages URL.
2. Enter a prompt and click **Generate image**.
3. If it fails, check:
   - Render service is live.
   - `OPENAI_API_KEY` is set in Render.
   - `src/config.js` has the exact Render URL (no trailing slash needed).

## Notes

- Keep your `.env` file private. Do not share it.
- If you get an API error, check that your API key is correct and active.
