const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
  const cwd = process.cwd();
  const apiFiles = fs.existsSync(path.join(cwd, 'api'))
    ? fs.readdirSync(path.join(cwd, 'api'))
    : [];
  res.json({ cwd, apiFiles });
};
