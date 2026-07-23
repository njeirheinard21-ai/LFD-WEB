# Deployment Guide

## Prerequisites
- Node.js 20+
- Google Cloud / Firebase Project setup
- `firebase-tools` CLI installed

## CI/CD Workflow
A GitHub Actions workflow is provided in `.github/workflows/ci.yml`. It automatically lints, type-checks, and builds the application on every push to `main`.

## Manual Deployment
1. Install dependencies: `npm ci`
2. Configure Firebase: Provide `firebase-applet-config.json` and `.env` variables.
3. Build the app: `npm run build`
4. Deploy to Firebase Hosting: `firebase deploy --only hosting`

## Rollback Strategy
Firebase Hosting supports instant one-click rollbacks from the Firebase Console if a deployment introduces regressions.
