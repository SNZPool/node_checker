const axios = require('axios');
const { metrics } = require('./metrics');
const logger = require('./logger');

async function checkEvmNodeStatus(config) {
  try {
    // Fetch Latest Block Height
    const latestBlockResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    });
    const latestHeight = parseInt(latestBlockResponse.data.result, 16);
    metrics.latestHeight.set(latestHeight);
    
    // Fetch Finalized Block Height
    const finalizedBlockResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['finalized', false],
      id: 1,
    });
    
    if (finalizedBlockResponse.data.result && finalizedBlockResponse.data.result.number) {
      finalizedHeight = parseInt(finalizedBlockResponse.data.result.number, 16);
    } else {
      finalizedHeight = latestHeight;
    }
    metrics.finalizedHeight.set(finalizedHeight);

    // Fetch the Latest Block timestamp to compare with system time
    const latestBlockDetails = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
      id: 1,
    });

    const latestTimestamp = parseInt(latestBlockDetails.data.result.timestamp, 16);
    const currentTime = Math.floor(Date.now() / 1000); // System time in seconds
    const blockTimeLag = currentTime - latestTimestamp;
    metrics.blockTimeLag.set(blockTimeLag);

    // Log and determine node health
    if (blockTimeLag > config.maxLagTime) {
      logger.warn(`Node is lagging: ${blockTimeLag} seconds behind`);
      metrics.status.set(0);
      return false;
    } else {
      logger.info(`Node is healthy`);
      metrics.status.set(1);
      return true;
    }
  } catch (error) {
    logger.error(`Error checking node status: ${error.message}`);
    metrics.status.set(0);
    return false;
  }
}

async function checkStarknetNodeStatus(config) {
  try {
    // Fetch Latest Block Height
    const latestBlockResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'starknet_blockNumber',
      params: [],
      id: 1,
    });

    const latestHeight = parseInt(latestBlockResponse.data.result, 10);
    metrics.latestHeight.set(latestHeight);

    // Fetch Finalized Block Height (StarkNet does not have "finalized" blocks like Ethereum)
    // You can reuse the latest height as a proxy for now, or adapt to your needs
    metrics.finalizedHeight.set(latestHeight);

    // Fetch the Latest Block timestamp
    const latestBlockDetails = await axios.post(config.rpcUrl, {
      jsonrpc: '2.0',
      method: 'starknet_getBlockWithTxHashes',
      params: ["latest"],
      id: 1,
    });
    const latestTimestamp = parseInt(latestBlockDetails.data.result.timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000); // System time in seconds
    const blockTimeLag = currentTime - latestTimestamp;
    metrics.blockTimeLag.set(blockTimeLag);

    // Log and determine node health
    if (blockTimeLag > config.maxLagTime) {
      logger.warn(`Node is lagging: ${blockTimeLag} seconds behind`);
      metrics.status.set(0);
      return false;
    } else {
      logger.info(`Node is healthy`);
      metrics.status.set(1);
      return true;
    }
  } catch (error) {
    logger.error(`Error checking node status: ${error.message}`);
    metrics.status.set(0);
    return false;
  }
}

async function checkBtcNodeStatus(config) {
  try {
    // Fetch Latest Block Height using Bitcoin's getblockcount method
    const latestBlockResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '1.0',
      method: 'getblockcount',
      params: [],
      id: 1,
    });
    const latestHeight = latestBlockResponse.data.result;
    metrics.latestHeight.set(latestHeight);
    metrics.finalizedHeight.set(latestHeight);

    // Fetch the Latest Block hash to get block details using getblock method
    const blockHashResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '1.0',
      method: 'getblockhash',
      params: [latestHeight],
      id: 1,
    });
    const blockHash = blockHashResponse.data.result;

    const blockDetailsResponse = await axios.post(config.rpcUrl, {
      jsonrpc: '1.0',
      method: 'getblock',
      params: [blockHash],
      id: 1,
    });

    // Fetch block timestamp (in seconds since Unix epoch)
    const latestTimestamp = blockDetailsResponse.data.result.time;
    const currentTime = Math.floor(Date.now() / 1000); // System time in seconds
    const blockTimeLag = currentTime - latestTimestamp;

    //
    metrics.blockTimeLag.set(blockTimeLag);
    if (blockTimeLag > config.maxLagTime) {
      logger.warn(`Node is lagging: ${blockTimeLag} seconds behind`);
      metrics.status.set(0);
      return false;
    } else {
      logger.info(`Node is healthy`);
      metrics.status.set(1);
      return true;
    }
    
  } catch (error) {
    logger.error(`Error checking BTC node status: ${error.message}`);
    metrics.status.set(0);
    return false
  }
}

function normalizeAptosBaseUrl(rpcUrl) {
  return rpcUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
}

async function checkAptosNodeStatus(config) {
  try {
    const ledgerInfoUrl = `${normalizeAptosBaseUrl(config.rpcUrl)}/v1`;
    const ledgerInfoResponse = await axios.get(ledgerInfoUrl);

    const latestHeight = parseInt(ledgerInfoResponse.data.block_height, 10);
    metrics.latestHeight.set(latestHeight);
    metrics.finalizedHeight.set(latestHeight);

    const latestTimestamp = Math.floor(
      parseInt(ledgerInfoResponse.data.ledger_timestamp, 10) / 1_000_000
    );
    const currentTime = Math.floor(Date.now() / 1000);
    const blockTimeLag = currentTime - latestTimestamp;
    metrics.blockTimeLag.set(blockTimeLag);

    if (blockTimeLag > config.maxLagTime) {
      logger.warn(`Node is lagging: ${blockTimeLag} seconds behind`);
      metrics.status.set(0);
      return false;
    }

    logger.info('Node is healthy');
    metrics.status.set(1);
    return true;
  } catch (error) {
    logger.error(`Error checking Aptos node status: ${error.message}`);
    metrics.status.set(0);
    return false;
  }
}

async function solanaRpc(config, method, params = []) {
  const response = await axios.post(config.rpcUrl, {
    jsonrpc: '2.0',
    method,
    params,
    id: 1,
  });

  if (response.data.error) {
    throw new Error(response.data.error.message || JSON.stringify(response.data.error));
  }

  return response.data.result;
}

async function checkSolanaNodeStatus(config) {
  try {
    // Report block height (not slot) so the value is comparable to other tools and explorers;
    // slot numbers run ~5% ahead of block height because of skipped slots.
    const latestHeight = await solanaRpc(config, 'getBlockHeight', [{ commitment: 'confirmed' }]);
    metrics.latestHeight.set(latestHeight);

    let finalizedHeight = latestHeight;
    try {
      finalizedHeight = await solanaRpc(config, 'getBlockHeight', [{ commitment: 'finalized' }]);
    } catch (error) {
      logger.warn(`Unable to fetch finalized block height, using latest: ${error.message}`);
    }
    metrics.finalizedHeight.set(finalizedHeight);

    // getBlockTime is keyed by slot, not block height.
    const latestSlot = await solanaRpc(config, 'getSlot', [{ commitment: 'confirmed' }]);
    const blockTime = await solanaRpc(config, 'getBlockTime', [latestSlot]);
    if (blockTime === null || blockTime === undefined) {
      logger.warn('Latest slot block time is unavailable');
      metrics.status.set(0);
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const blockTimeLag = currentTime - blockTime;
    metrics.blockTimeLag.set(blockTimeLag);

    if (blockTimeLag > config.maxLagTime) {
      logger.warn(`Node is lagging: ${blockTimeLag} seconds behind`);
      metrics.status.set(0);
      return false;
    }

    logger.info('Node is healthy');
    metrics.status.set(1);
    return true;
  } catch (error) {
    logger.error(`Error checking Solana node status: ${error.message}`);
    metrics.status.set(0);
    return false;
  }
}

module.exports = {
  checkEvmNodeStatus,
  checkStarknetNodeStatus,
  checkBtcNodeStatus,
  checkAptosNodeStatus,
  checkSolanaNodeStatus,
};