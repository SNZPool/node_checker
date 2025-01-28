const fs = require('fs');

function loadConfig(configPath = 'config.json') {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config;
}

module.exports = { loadConfig };