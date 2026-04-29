# Copilot Instructions for BeachRead

## Project Overview
BeachRead is a full-stack application built with:
- **Client**: React-based frontend
- **API**: Backend server
- **MCP Server**: Supabase integration via HTTP MCP server (runs on port 3002)
- **Database**: Supabase PostgreSQL

## Getting Started

### Install Dependencies
```bash
npm run install:all
```

### Start Services
- **MCP Server** (Supabase): `npm run start:mcp` (port 3002)
- **API Server**: `npm run start:api`
- **Client Dev**: `npm run start:client`
- **Full Dev**: `npm run dev`

## MCP Server Configuration

### Supabase MCP Server
- **Location**: `./mcp-server`
- **Runtime**: Node.js with Express
- **Port**: 3002
- **Status Check**: `curl http://localhost:3002/health`

### Available Endpoints
- `GET /` - Status page
- `GET /health` - Health check
- `GET /profiles` - Query profiles from Supabase

### Environment Variables
The MCP server requires:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for admin access
- `PORT` - Server port (default: 3002)

## Database

### Supabase Access
- **Project ID**: utcoxardgtuzufroeuey
- **URL**: https://utcoxardgtuzufroeuey.supabase.co
- Tables managed through Supabase dashboard

## Development Guidelines

- Ensure MCP server is running before working with database operations
- Use the MCP endpoints to query data when needed
- Check `/health` endpoint for server status

## Build & Test

```bash
npm run build    # Build client
npm run lint     # Lint client code
```
