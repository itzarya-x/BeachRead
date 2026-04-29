import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3002);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
  },
});

app.get('/', (_req, res) => {
  res.send('MCP server is running');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mcp-server' });
});

app.get('/profiles', async (_req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').limit(10);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ data });
});

app.listen(port, () => {
  console.log(`MCP server listening on http://localhost:${port}`);
});
