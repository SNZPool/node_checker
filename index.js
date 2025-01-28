const logger = require('./src/logger');
const { startMetricsServer } = require('./src/metrics');
const { startHealthCheckServer } = require('./src/healthCheck');
const { loadConfig } = require('./src/config');
const { checkEvmNodeStatus, checkStarknetNodeStatus, checkBtcNodeStatus } = require('./src/check.js');  // 引入新模块

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

let nodeHealthy = false;
let nodeStatusChecker;
switch (config.nodeType) {
  case "evm":
    nodeStatusChecker = async () => {
      nodeHealthy = await checkEvmNodeStatus(config);
    };
    break;
  case "starknet":
    nodeStatusChecker = async () => {
      nodeHealthy = await checkStarknetNodeStatus(config);
    };
    break;
  case "btc":
    nodeStatusChecker = async () => {
      nodeHealthy = await checkBtcNodeStatus(config);
    };
    break;
  default:
    logger.error(`${config.nodeType} is not supported`);
    process.exit(1);
}
startMetricsServer(metricsPort);
startHealthCheckServer(healthCheckPort, () => nodeHealthy);
const nodeStatusInterval = setInterval(nodeStatusChecker, nodeCheckInterval);

//
process.on('SIGINT', () => {
  clearInterval(nodeStatusInterval);
  logger.info('Node status check stopped.');
  process.exit();
});

//
logger.info('Blockchain Node Checker is running...');
