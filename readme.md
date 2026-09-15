# Blockchain Node Checker

Blockchain Node Checker is a lightweight and robust tool built with Node.js to monitor the synchronization status and health of blockchain nodes. It is designed to provide crucial metrics for monitoring and facilitate health checks for load balancers. The tool is highly configurable, resilient to network fluctuations, and integrates seamlessly with Prometheus for monitoring.

## Features

1. **Configuration Support**: Import configurations via a file, including:
   - RPC URL
   - Maximum block time lag tolerance
2. **Node Monitoring**:
   - Fetch `Latest Height`, `Finalized Height`, and `Latest Block` timestamp via RPC.
   - Compare `Latest Block` timestamp with the system time to assess node validity.
3. **Prometheus Integration**: Expose metrics through a dedicated metrics endpoint.
4. **Health Check Endpoint**: Provide a health check endpoint for load balancers to determine node health.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/snzpool/node_checker.git
   cd node_checker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the tool using the provided configuration file template.

## Configuration

Create a `config.json` file in the root directory (use the provided `config.example.json` as a template):

```json
{
  "rpcUrl": "https://eth-mainnet.public.blastapi.io",
  "nodeType": "evm",
  "interval": 5000,
  "maxLagTime": 60,
  "metricsPort": 8080,
  "healthCheckPort": 9090
}
```

### Configuration Options
- **rpcUrl**: The RPC URL of the blockchain node.
- **nodeType**: The type of the blockchain node: `evm`, `starknet`, `btc`, `aptos`, and `solana`.
- **interval**: This interval(ms) determines how often the tool checks the node's synchronization status.
- **maxLagTime**: Maximum allowed time lag before marking the node as unhealthy.
- **metricsPort**: Port to expose Prometheus metrics.
- **healthCheckPort**: Port for the health check endpoint.
- **healthCheckPath** (optional): Path for the health check endpoint. Defaults to `/` (root). The legacy path `/health` is also supported when using the default.
- **opNodeRpcUrl** (optional): RPC URL of the OP Stack `op-node` (e.g. `http://127.0.0.1:9545`). When set, its libp2p peer count is exported as `op_node_peer_count`.

### Node Type Notes

| `nodeType` | RPC style | Recommended `maxLagTime` | Notes |
|------------|-----------|--------------------------|-------|
| `evm` | JSON-RPC 2.0 | 60s | Ethereum-compatible chains |
| `starknet` | JSON-RPC 2.0 | 90s | |
| `btc` | JSON-RPC 1.0 | 3600s | Longer tolerance for Bitcoin block times |
| `aptos` | REST (`GET /v1`) | 30–60s | `rpcUrl` may be written with or without `/v1` suffix |
| `solana` | JSON-RPC 2.0 | 60–120s | Uses `getSlot` + `getBlockTime` for block time lag |

## Usage

1. Create and configure the `config.json` file:
   Ensure the file is in the root directory and properly set according to your environment.

2. Start the tool with the configuration file:
   ```bash
   node index.js --config=config.json
   ```
   The tool will automatically load settings from the specified configuration file.

3. Monitor logs:
   ```bash
   tail -f logs/app.log
   ```

4. Access Prometheus metrics:
   Visit `http://localhost:<metricsPort>/metrics`.

5. Use the health check endpoint:
   Send a request to `http://localhost:<healthCheckPort>/` (or `http://localhost:<healthCheckPort>/health` for backward compatibility).

## Metrics
The tool exposes the following metrics for Prometheus:
- `node_latest_height`: Latest block height of the node.
- `node_finalized_height`: Finalized block height of the node.
- `node_block_time_lag`: Time difference between the latest block timestamp and the system time (in seconds).
- `node_status`: Node health status (1 for healthy, 0 for unhealthy).
- `node_peer_count`: Number of peers connected to the node, or `-1` if the query failed or has not completed yet. Supported for `evm` (`net_peerCount`) and `btc` (`getconnectioncount`). A failed peer query never affects `node_status` or the health check.
- `op_node_peer_count`: Number of libp2p peers connected to `op-node` (via `opp2p_peerStats`), or `-1` if the query failed. Only exported when `opNodeRpcUrl` is configured. On OP Stack chains this is usually more meaningful than `node_peer_count`, since the execution client may run with P2P disabled.

## Health Check
The health check server listens on `healthCheckPort`. By default, probe the root path `/`; no subpath configuration is required. You can optionally set `healthCheckPath` in the config to use a custom path (e.g. `/health`).

The health check endpoint returns:
- **200 OK** if the node is healthy.
- **503 Service Unavailable** if the node is unhealthy.

## Logging
Logs are stored in the `logs` directory

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any feature requests or bug fixes.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
