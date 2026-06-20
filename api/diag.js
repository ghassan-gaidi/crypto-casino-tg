module.exports = async (req, res) => {
  let result = {};
  try {
    const gm = require('grammy');
    result.grammy_loaded = true;
    result.grammy_keys = Object.keys(gm).slice(0, 20);
    const gm2 = require('../src/supabase');
    result.supabase_loaded = true;
    result.supabase_keys = Object.keys(gm2).slice(0, 20);
    const gm3 = require('../src/provably-fair');
    result.pf_loaded = true;
    const gm4 = require('../src/games/dice');
    result.dice_loaded = true;
    const gm5 = require('ethers');
    result.ethers_loaded = true;
  } catch(e) {
    result.error = e.message;
    result.stack = e.stack?.split('\n').slice(0,8).join('\n');
  }
  res.json(result);
};
