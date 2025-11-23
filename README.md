# Relay Client (TypeScript)

TypeScript client for the Symbiotic Relay built with Connect RPC and @bufbuild/protobuf.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/symbioticfi/relay-client-ts)

## Usage 

Create a transport with @connectrpc/connect-node and instantiate the SymbioticAPIService client with that transport.

See [examples/](./examples/) directory for comprehensive usage examples including:

- Basic client setup and connection
- Message signing and aggregation
- Streaming operations
- Error handling patterns

To get started with the examples:
```bash
cd examples/
npm install
npm run basic-usage
``` 

## Development 

Run scripts/update-proto.sh to fetch upstream proto and regenerate; run npm run build to compile to dist.
