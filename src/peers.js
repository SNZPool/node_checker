const axios = require('axios');
const { metrics, register } = require('./metrics');
const logger = require('./logger');

// Peer count is informational only: it must never affect node health status.
const PEER_REQUEST_TIMEOUT = 5000;
const PEER_COUNT_UNKNOWN = -1;

async function jsonRpc(url, jsonrpc, method, params = []) {
  const response = await axios.post(
    url,
    { jsonrpc, method, params, id: 1 },
    { timeout: PEER_REQUEST_TIMEOUT }
  );

  if (response.data.error) {
    throw new Error(response.data.error.message || JSON.stringify(response.data.error));
  }

  return response.data.result;
}

async function getEvmPeerCount(config) {
  const result = await jsonRpc(config.rpcUrl, '2.0', 'net_peerCount');
  return parseInt(result, 16);
}

async function getBtcPeerCount(config) {
  return jsonRpc(config.rpcUrl, '1.0', 'getconnectioncount');
}

// OP Stack consensus layer (op-node) libp2p peers, served on its own RPC port.
async function getOpNodePeerCount(config) {
  const result = await jsonRpc(config.opNodeRpcUrl, '2.0', 'opp2p_peerStats');
  return result.connected;
}

// starknet, aptos and solana have no equivalent RPC for the node's own peers.
const peerCountRegistry = {
  evm: getEvmPeerCount,
  btc: getBtcPeerCount,
};

// Wraps a peer count query into an async checker that never throws,
// so callers cannot accidentally propagate peer failures.
function createPeerCountChecker(name, gauge, getPeerCount, config) {
  // Report unknown until the first query completes, so 0 always means "no peers".
  gauge.set(PEER_COUNT_UNKNOWN);

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
      gauge.set(peerCount);
    } catch (error) {
      logger.warn(`Unable to fetch ${name} peer count: ${error.message}`);
      gauge.set(PEER_COUNT_UNKNOWN);
    } finally {
      running = false;
    }
  };
}

// Returns the peer count checkers enabled for this config (possibly empty).
function getPeerCountCheckers(config) {
  const checkers = [];

  const getPeerCount = peerCountRegistry[config.nodeType];
  if (getPeerCount) {
    checkers.push(createPeerCountChecker(config.nodeType, metrics.peerCount, getPeerCount, config));
  } else {
    logger.info(`Peer count is not supported for ${config.nodeType}, skipping`);
  }

  if (config.opNodeRpcUrl) {
    register.registerMetric(metrics.opNodePeerCount);
    checkers.push(createPeerCountChecker('op-node', metrics.opNodePeerCount, getOpNodePeerCount, config));
  }

  return checkers;
}

module.exports = { getPeerCountCheckers };
