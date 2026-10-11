# Environment Setup

To run Pahchaan locally, ensure the following environment variables are set in your `.env` or `.env.local`:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/identity?retryWrites=true&w=majority

# Authentication (Auth.js)
AUTH_SECRET=your-secure-auth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
