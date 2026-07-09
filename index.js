const logger = require('./src/logger');
const { startMetricsServer } = require('./src/metrics');
const { startHealthCheckServer } = require('./src/healthCheck');
const { loadConfig } = require('./src/config');
const {
  checkEvmNodeStatus,
  checkStarknetNodeStatus,
  checkBtcNodeStatus,
  checkAptosNodeStatus,
  checkSolanaNodeStatus,
} = require('./src/check.js');

//
const configPath = process.argv[2]?.split('=')[1] || 'config.json';
let config;
try {
  config = loadConfig(configPath);
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

//
const metricsPort = process.env.METRICS_PORT || config.metricsPort;
const healthCheckPort = process.env.HEALTH_PORT || config.healthCheckPort;
const nodeCheckInterval = config.interval || 10000;

const checkerRegistry = {
  evm: checkEvmNodeStatus,
  starknet: checkStarknetNodeStatus,
  btc: checkBtcNodeStatus,
  aptos: checkAptosNodeStatus,
  solana: checkSolanaNodeStatus,
};

const checker = checkerRegistry[config.nodeType];
if (!checker) {
  logger.error(`${config.nodeType} is not supported`);
  process.exit(1);
}

let nodeHealthy = false;
const nodeStatusChecker = async () => {
  nodeHealthy = await checker(config);
};
startMetricsServer(metricsPort);
startHealthCheckServer(healthCheckPort, () => nodeHealthy, config.healthCheckPath);
const nodeStatusInterval = setInterval(nodeStatusChecker, nodeCheckInterval);

//
process.on('SIGINT', () => {
  clearInterval(nodeStatusInterval);
  logger.info('Node status check stopped.');
  process.exit();
});

//
logger.info('Blockchain Node Checker is running...');
