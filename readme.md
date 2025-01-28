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
  "metricsPort": 9090,
  "healthCheckPort": 8080
}
```

### Configuration Options
- **rpcUrl**: The RPC URL of the blockchain node.
- **nodeType**: The type of the blockchain node: `evm`, `starknet` and `btc`.
- **interval**: This interval(ms) determines how often the tool checks the node's synchronization status.
- **maxLagTime**: Maximum allowed time lag before marking the node as unhealthy.
- **metricsPort**: Port to expose Prometheus metrics.
- **healthCheckPort**: Port for the health check endpoint.

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
   Send a request to `http://localhost:<healthCheckPort>/health`.

## Metrics
The tool exposes the following metrics for Prometheus:
- `node_latest_height`: Latest block height of the node.
- `node_finalized_height`: Finalized block height of the node.
- `node_block_time_lag`: Time difference between the latest block timestamp and the system time (in seconds).
- `node_status`: Node health status (1 for healthy, 0 for unhealthy).

## Health Check
The health check endpoint returns:
- **200 OK** if the node is healthy.
- **503 Service Unavailable** if the node is unhealthy.

## Logging
Logs are stored in the `logs` directory

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any feature requests or bug fixes.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
