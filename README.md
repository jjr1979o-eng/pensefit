# Pensefit Custos 🚀

Professional management for modern meal prep businesses.

## Features
- 📊 Cloud Dashboard
- 🛒 Cloud-synced Ingredients & Purchases
- 🍱 Recipe Cost Calculation
- 📄 Receipt Scanner (OCR)
- 🔒 Secure Firebase Authentication

## Netlify Deployment Tips
To make the application work on Netlify:

1. **SPA Redirects**: This project includes a `netlify.toml` and `public/_redirects` to handle SPA routing.
2. **Authorized Domains**: You **MUST** add your Netlify domain (e.g., `yourapp.netlify.app`) to the **Authorized Domains** list in the **Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Authentication > Settings > Authorized domains
   - Add your Netlify URL
3. **Environment**: If you use custom env vars, set them in the Netlify dashboard.

## Local Development
```bash
npm install
npm run dev
```
