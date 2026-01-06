# Next.js Migration Notes

This project has been migrated from Create React App to Next.js.

## Key Changes

### 1. Project Structure
- **Old**: `src/App.js` with React Router
- **New**: `app/` directory with file-based routing
- Pages are now in `app/[route]/page.js` format

### 2. Routing
- **Old**: React Router with `<Route>` components
- **New**: Next.js file-based routing
- `Link` components now use `href` instead of `to`
- `useLocation` replaced with `usePathname` from `next/navigation`

### 3. API Routes
- **Old**: Express server in `server.js`
- **New**: Next.js API routes in `app/api/[route]/route.js`
- API endpoints are now at `/api/contact`, `/api/feedback`, `/api/test-email`

### 4. Environment Variables
- **Old**: `REACT_APP_MAPBOX_ACCESS_TOKEN`
- **New**: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (for client-side) or `MAPBOX_ACCESS_TOKEN` (for server-side)
- Update your `.env` file accordingly

### 5. Client Components
- Components using hooks, browser APIs, or client-side libraries need `'use client'` directive
- All map components, modals, and interactive components are now client components

### 6. Build & Run
- **Old**: `npm start` (runs on port 3000)
- **New**: `npm run dev` (runs on port 3000)
- **Build**: `npm run build` then `npm start`

### 7. Configuration Files
- `next.config.js` - Next.js configuration
- `jsconfig.json` - Path aliases for imports
- `tailwind.config.js` - Updated content paths

## Migration Checklist

- [x] Updated package.json with Next.js dependencies
- [x] Created Next.js app directory structure
- [x] Converted Express API routes to Next.js API routes
- [x] Converted React Router pages to Next.js pages
- [x] Updated all Link components to use Next.js Link
- [x] Added 'use client' directives where needed
- [x] Updated environment variable references
- [x] Updated Tailwind config for Next.js
- [x] Created root layout and global styles

## Next Steps

1. Update `.env` file with `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
2. Test all pages and API endpoints
3. Update any remaining hardcoded API URLs
4. Test the map functionality
5. Run `npm install` to install new dependencies
6. Run `npm run dev` to start development server

## Notes

- The old `src/pages/` directory is kept for reference but not used
- The old `server.js` file is kept for reference but not used
- All components in `src/components/` are still used and have been updated for Next.js compatibility

