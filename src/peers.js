const axios = require('axios');
const { metrics } = require('./metrics');
const logger = require('./logger');

// Peer count is informational only: it must never affect node health status.
const PEER_REQUEST_TIMEOUT = 5000;
const PEER_COUNT_UNKNOWN = -1;

async function jsonRpc(config, jsonrpc, method, params = []) {
  const response = await axios.post(
    config.rpcUrl,
    { jsonrpc, method, params, id: 1 },
    { timeout: PEER_REQUEST_TIMEOUT }
  );

  if (response.data.error) {
    throw new Error(response.data.error.message || JSON.stringify(response.data.error));
  }

  return response.data.result;
}

async function getEvmPeerCount(config) {
  const result = await jsonRpc(config, '2.0', 'net_peerCount');
  return parseInt(result, 16);
}

async function getBtcPeerCount(config) {
  return jsonRpc(config, '1.0', 'getconnectioncount');
}

// starknet, aptos and solana have no equivalent RPC for the node's own peers.
const peerCountRegistry = {
  evm: getEvmPeerCount,
  btc: getBtcPeerCount,
};

// Returns an async checker for the configured node type, or null if unsupported.
// The checker never throws, so callers cannot accidentally propagate peer failures.
function getPeerCountChecker(config) {
  const getPeerCount = peerCountRegistry[config.nodeType];
  if (!getPeerCount) {
    return null;
  }

  // Report unknown until the first query completes, so 0 always means "no peers".
  metrics.peerCount.set(PEER_COUNT_UNKNOWN);

  let running = false;
  return async () => {
    // Skip if the previous query is still pending, so slow peers don't pile up requests.
    if (running) {
      return;
    }
    running = true;
    try {
      const peerCount = await getPeerCount(config);
      if (!Number.isFinite(peerCount)) {
        throw new Error(`Invalid peer count: ${peerCount}`);
      }
      metrics.peerCount.set(peerCount);
    } catch (error) {
      logger.warn(`Unable to fetch peer count: ${error.message}`);
      metrics.peerCount.set(PEER_COUNT_UNKNOWN);
    } finally {
      running = false;
    }
  };
}

module.exports = { getPeerCountChecker };
