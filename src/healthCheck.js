const express = require('express');

function startHealthCheckServer(port, isNodeHealthy, healthCheckPath = '/') {
  const app = express();

  const healthHandler = (req, res) => {
    if (isNodeHealthy()) {
      res.status(200).send('OK');
    } else {
      res.status(503).send('Service Unavailable');
    }
  };

  app.get(healthCheckPath, healthHandler);

  // Keep /health for backward compatibility when a custom path is configured.
  if (healthCheckPath !== '/health') {
    app.get('/health', healthHandler);
  }

  app.listen(port, () => {
    console.log(`Health check server running on port ${port} (path: ${healthCheckPath})`);
  });
}

module.exports = { startHealthCheckServer };
