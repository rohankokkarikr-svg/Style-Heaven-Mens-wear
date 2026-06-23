const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const dns = require('dns');

// Force IPv4 first to avoid ConnectTimeoutError on networks with broken IPv6
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: false, // Important for showing images from Cloudinary/other domains
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/settings', require('./routes/settings'));

// Health check — also checks if Supabase is reachable
app.get('/health', async (req, res) => {
  let supabaseStatus = 'unknown';
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl) {
      const host = new URL(supabaseUrl).hostname;
      await new Promise((resolve, reject) => {
        dns.lookup(host, { family: 4 }, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      supabaseStatus = 'reachable';
    } else {
      supabaseStatus = 'not_configured';
    }
  } catch (e) {
    supabaseStatus = `unreachable (${e.code || e.message})`;
  }

  const isHealthy = supabaseStatus === 'reachable';
  res.status(isHealthy ? 200 : 503).json({ 
    status: isHealthy ? 'ok' : 'degraded', 
    time: new Date(),
    node: process.version,
    env: process.env.NODE_ENV,
    supabase: supabaseStatus,
    message: isHealthy
      ? 'All systems operational'
      : '⚠️  Cannot reach Supabase. Check your project URL in .env or resume the project at supabase.com'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Provide helpful error for Supabase connectivity issues
  if (err.code === 'ENOTFOUND' || err.message?.includes('fetch failed')) {
    return res.status(503).json({
      error: 'Database unreachable',
      details: 'Cannot connect to Supabase. The project may be paused or the URL is incorrect.',
      action: 'Visit https://supabase.com, check your project is active, and verify SUPABASE_URL in backend/.env',
      supabaseUrl: process.env.SUPABASE_URL
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`
  🚀 Style Heaven Backend is running!
  📡 Port: ${PORT}
  🌍 Host: 0.0.0.0 (Localhost)
  🛠️  Node: ${process.version}
  `);

  // Startup connectivity check
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('  ❌ SUPABASE_URL is not set in backend/.env');
      return;
    }
    const host = new URL(supabaseUrl).hostname;
    dns.lookup(host, { family: 4 }, (err, address) => {
      if (err) {
        console.error(`  ❌ Supabase DNS lookup FAILED for: ${host}`);
        console.error(`     Error: ${err.code} - ${err.message}`);
        console.error(`  ⚠️  ACTION REQUIRED:`);
        console.error(`     1. Go to https://supabase.com/dashboard`);
        console.error(`     2. Check if project "${host.split('.')[0]}" exists and is ACTIVE (not paused)`);
        console.error(`     3. If paused: click "Resume project"`);
        console.error(`     4. If deleted: create a new project and update SUPABASE_URL + SUPABASE_SERVICE_KEY in backend/.env`);
        console.error(`     5. Then restart the server`);
      } else {
        console.log(`  ✅ Supabase is reachable at ${address}`);
      }
    });
  } catch (e) {
    console.error('  ❌ Could not parse SUPABASE_URL:', e.message);
  }
});

// Trigger restart to load new environment variables from .env

