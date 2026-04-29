# MCP Server

This folder contains a minimal Node.js MCP server scaffold intended to connect to Supabase with a service role key.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `SUPABASE_SERVICE_KEY` to your Supabase service key.
3. Confirm `SUPABASE_URL` is correct for your project. For the provided project ref, use `https://utcoxardgtuzufroeuey.supabase.co`.
4. Install dependencies:

```bash
npm install
```

5. Run the server:

```bash
npm run start
```

## Endpoints

- `GET /` - sanity check
- `GET /health` - health status
- `GET /profiles` - sample Supabase query using the service role key

## Notes

- Do not commit `.env` or your service key into source control.
- The server uses `@supabase/supabase-js` with a service-role key for trusted backend operations.
