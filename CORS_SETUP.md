# Firebase Storage CORS Configuration

## Apply CORS Rules

To fix Firebase Storage CORS issues, run this command:

```bash
gsutil cors set cors.json gs://paddy-b479b.appspot.com
```

## Prerequisites

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project paddy-b479b`

## Alternative: Firebase Console Method

1. Go to Firebase Console → Storage → Rules
2. Update storage rules to allow authenticated uploads
3. Deploy rules: `firebase deploy --only storage`

## Verification

After applying CORS rules, restart your dev server:
```bash
npm run dev
```

Test image upload from `http://localhost:5173` - should work without CORS errors.
