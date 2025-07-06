# Multi-Tenant Analytics Dashboard

A website analytics dashboard built with **Remix** frontend and **Convex** backend, designed for multi-tenant SaaS use.

## Tech Stack

- **Frontend**: Remix (SSR React framework)
- **Backend**: Convex (Backend-as-a-Service)
- **Hosting**: Railway (for Remix app)
- **Styling**: Tailwind CSS
- **APIs**: Google Analytics & Search Console

## Project Structure

- `app/` - Remix frontend application
- `convex/` - Convex backend functions and schema
- `public/` - Static assets

## Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start both frontend and backend
npm run dev

# Or start them separately:
npm run dev:frontend  # Remix dev server
npm run dev:backend   # Convex dev server
```

## Multi-Tenant Features

### Current Implementation
- **Tenant Isolation**: Each client belongs to a tenant (domain-based)
- **Role-based Access**: Admin and Viewer roles
- **Google Integration**: OAuth for Analytics & Search Console
- **Session Management**: Secure token-based sessions

### Demo Data
1. Create demo tenant and client:
   ```bash
   # In the app, click "Create Demo Data"
   # Or run the seed function in Convex dashboard
   ```

2. Login with demo credentials:
   - **Domain**: `demo.example.com`
   - **Email**: `demo@example.com`
   - **Password**: `demo123`

## Deployment

### Railway Deployment

1. **Connect GitHub to Railway**:
   - Push your code to GitHub
   - Go to [Railway.app](https://railway.app) and create account
   - Click "Deploy from GitHub repo" 
   - Select your repository
   - Railway will automatically detect Remix and deploy!

2. **Environment Variables**:
   Set these in Railway dashboard:
   ```
   VITE_CONVEX_URL=https://sincere-cow-339.convex.cloud
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Auto-deployment**:
   - Every push to `main` automatically deploys
   - No additional configuration needed!

### Multi-Tenant Setup for Your Clients

1. **For Your Master Account**:
   - Create your own tenant with your domain
   - Connect your Google Analytics account
   - Access all client properties you manage

2. **For Client Self-Service**:
   - Clients can register with their domain
   - They can connect their own Google accounts
   - View only their own website data

3. **Property Switching**:
   - You can switch between client dashboards
   - Each tenant is isolated
   - Role-based permissions apply

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
