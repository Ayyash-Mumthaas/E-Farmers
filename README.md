# Paddy3 - Farmer Dashboard

A React + Vite application for farmers to manage their rice products with AI-powered price suggestions.

## Features

- 🌾 Rice product management
- 🤖 AI price suggestions
- 📸 Image upload to Firebase Storage
- 🔐 User authentication
- 📍 Sri Lankan location support

## Firebase CORS Fix

To fix the Firebase Storage CORS issue during development:

1. **Create a file named `cors.json` in your root directory** (already created)
2. **Apply CORS rules:**
   ```bash
   gsutil cors set cors.json gs://paddy-b479b.appspot.com
   ```
3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### Prerequisites for CORS Fix

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project paddy-b479b`

### Alternative: Firebase Console Method

1. Go to Firebase Console → Storage → Rules
2. Update storage rules to allow authenticated uploads
3. Deploy rules: `firebase deploy --only storage`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Firebase Configuration

The app uses Firebase for:
- Authentication
- Firestore Database
- Storage (for image uploads)

Make sure your `.env` file contains the correct Firebase credentials.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
