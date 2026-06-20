module.exports = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const results = {};
  
  // Check files
  const filesToCheck = [
    'api/bot.js',
    'src/supabase.js', 
    'src/wallet.js',
    'src/provably-fair.js',
    'src/games/dice.js',
    'src/games/coinflip.js'
  ];
  
  for (const f of filesToCheck) {
    const fullPath = path.join(process.cwd(), f);
    try {
      fs.accessSync(fullPath, fs.constants.R_OK);
      results[f] = 'EXISTS';
    } catch (e) {
      results[f] = 'MISSING';
    }
  }
  
  // Node version
  results.node_version = process.version;
  results.cwd = process.cwd();
  results.env = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    HOT_WALLET_PK: process.env.HOT_WALLET_PK ? 'SET' : 'MISSING',
    BASE_RPC_URL: process.env.BASE_RPC_URL ? 'SET' : 'MISSING',
    MINI_APP_URL: process.env.MINI_APP_URL ? 'SET' : 'MISSING',
    TELEGRAM_SECRET_TOKEN: process.env.TELEGRAM_SECRET_TOKEN ? 'SET' : 'MISSING',
    VERCEL_ENV: process.env.VERCEL_ENV ? 'SET' : 'MISSING',
  };
  
  // List api/ and src/ dirs
  try {
    results.api_files = fs.readdirSync(path.join(process.cwd(), 'api'));
  } catch (e) {
    results.api_files = `ERROR: ${e.message}`;
  }
  try {
    results.src_files = fs.readdirSync(path.join(process.cwd(), 'src'));
  } catch (e) {
    results.src_files = `ERROR: ${e.message}`;
  }
  
  res.status(200).json(results);
};
