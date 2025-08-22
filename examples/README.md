# Symbiotic Relay TypeScript Client Examples

This directory contains examples demonstrating how to use the Symbiotic Relay TypeScript client library.

## Prerequisites

1. Install dependencies and build the client library:
   ```bash
   cd relay-client-ts-ts/examples
   npm install
   ```
   
   This will automatically:
   - Install dependencies for the root relay-client-ts library
   - Build the TypeScript client library
   - Install example dependencies


2. Make sure you have a Symbiotic Relay server running (default: `localhost:8080`)

## Examples

### `basic-usage.ts`

A comprehensive example showing how to:

- Connect to a Symbiotic Relay server using Connect-RPC
- Get current and suggested epoch information
- Retrieve validator set data
- Sign messages and get aggregation proofs
- Use streaming sign-and-wait functionality

**Run the example:**
```bash
npm run basic-usage
```

**Environment variables:**
- `RELAY_SERVER_URL`: Override the default server URL (default: `localhost:8080`)


NOTE: for the signature/proof generation to work you need to run the script for all active relay servers to get the majority consensus to generate proof.

## Key Concepts

### Connect-RPC

This client uses [Connect-RPC](https://connectrpc.com/), a modern RPC framework that works over HTTP/1.1, HTTP/2, and HTTP/3. It provides:

- Type-safe client generation from protobuf definitions
- Streaming support
- Better error handling
- Web and Node.js compatibility

### Client Setup

```typescript
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { SymbioticAPIService } from "@symbioticfi/relay-client-ts";

const transport = createGrpcTransport({
  baseUrl: "localhost:8080",
});
const client = createClient(SymbioticAPIService, transport);
```

### Error Handling

Connect-RPC provides structured error handling:

```typescript
try {
  const response = await client.getCurrentEpoch(request);
} catch (error) {
  if (error.code) {
    console.error(`RPC error: ${error.code} - ${error.message}`);
  }
}
```

### Message Signing Workflow

1. **Get suggested epoch**: Use `getSuggestedEpoch` to get the recommended epoch for signing
2. **Sign message**: Call `signMessage` with your key tag, message, and optional epoch. Use `signMessageWait` for live streaming proof data.
3. **Wait for aggregation**: Either poll with `getAggregationProof` or use `signMessageWait` for real-time updates
4. **Retrieve proof**: Get the final aggregation proof for verification

### Streaming Responses

The `signMessageWait` method returns an async iterator:

```typescript
for await (const response of client.signMessageWait(request)) {
  switch (response.status) {
    case SigningStatus.SIGNING_STATUS_COMPLETED:
      console.log("Signing completed!");
      return;
    case SigningStatus.SIGNING_STATUS_FAILED:
      console.error("Signing failed:", response.error?.errorMessage);
      return;
  }
}
```

### Type Safety

All message types are fully typed with TypeScript:

```typescript
import { create } from "@bufbuild/protobuf";
import {
  SignMessageRequestSchema,
  SigningStatus,
  ValidatorSetStatus,
} from "@symbioticfi/relay-client-ts";

const request = create(SignMessageRequestSchema, {
  keyTag: 1,
  message: new TextEncoder().encode("Hello"),
  requiredEpoch: 123n, // BigInt for uint64
});
```


### Data Types

#### BigInt Handling

Protobuf `uint64` fields are represented as `bigint` in TypeScript:

```typescript
const epoch: bigint = 123n;
const request = new SignMessageRequest({ requiredEpoch: epoch });
```

#### Bytes Handling

Protobuf `bytes` fields use `Uint8Array`:

```typescript
const message = new TextEncoder().encode("Hello, world!");
const signature: Uint8Array = response.aggregationProof.proof;
```

#### Timestamps

Protobuf timestamps are converted to JavaScript `Date` objects:

```typescript
const startTime: Date = epochResponse.startTime.toDate();
```