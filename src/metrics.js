const client = require('prom-client');
const express = require('express');

const register = new client.Registry();
// client.collectDefaultMetrics({ register });

const metrics = {
  latestHeight: new client.Gauge({
    name: 'node_latest_height',
    help: 'Latest block height of the node',
    registers: [register]
  }),
  finalizedHeight: new client.Gauge({
    name: 'node_finalized_height',
    help: 'Finalized block height of the node',
    registers: [register]
  }),
  blockTimeLag: new client.Gauge({
    name: 'node_block_time_lag',
    help: 'Time difference between latest block timestamp and system time',
    registers: [register]
  }),
  status: new client.Gauge({
    name: 'node_status',
    help: 'Node health status (1 for healthy, 0 for unhealthy)',
    registers: [register]
  }),
  peerCount: new client.Gauge({
    name: 'node_peer_count',
    help: 'Number of peers connected to the node (-1 if the query failed)',
    registers: [register]
  }),
  opNodePeerCount: new client.Gauge({
    name: 'op_node_peer_count',
    help: 'Number of libp2p peers connected to op-node (-1 if the query failed)',
    // Registered only when opNodeRpcUrl is configured, see peers.js.
    registers: []
  })
};

function startMetricsServer(port) {
  const app = express();

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.listen(port, () => {
    console.log(`Metrics server running on port ${port}`);
  });
}

module.exports = { metrics, register, startMetricsServer };
