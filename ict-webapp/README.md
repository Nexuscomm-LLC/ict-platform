# ICT Platform Web App

Progressive Web App (PWA) for ICT Platform - Operations management for ICT/electrical contracting businesses.

## Features

- **Dashboard** - KPIs, stats, quick actions
- **Time Tracking** - Clock in/out with GPS, breaks, weekly view
- **Projects** - List, filter, search projects
- **Inventory** - Stock management, barcode scanning
- **Offline Support** - Works offline with sync queue
- **Dark Mode** - Light/dark/system theme support
- **PWA** - Installable on iOS, Android, and desktop

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=https://your-wordpress-site.com/wp-json/ict/v1
```

## Deployment

### Static Hosting (Vercel, Netlify, etc.)

1. Build the app: `npm run build`
2. Deploy the `dist` folder

### iOS Safari (Add to Home Screen)

1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will work offline and feel native

## Tech Stack

- React 18 + TypeScript
- Vite 8
- Redux Toolkit
- React Router
- Axios
- date-fns
- Lucide Icons

## Support

Phone: 630-709-8200
