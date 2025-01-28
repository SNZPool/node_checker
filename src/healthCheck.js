const express = require('express');

function startHealthCheckServer(port, isNodeHealthy) {
  const app = express();

  app.get('/health', (req, res) => {
    if (isNodeHealthy()) {
      res.status(200).send('OK');
    } else {
      res.status(503).send('Service Unavailable');
    }
  });

  app.listen(port, () => {
    console.log(`Health check server running on port ${port}`);
  });
}

module.exports = { startHealthCheckServer };
