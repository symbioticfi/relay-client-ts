#!/usr/bin/env node

/**
 * Basic usage example for the Symbiotic Relay TypeScript client.
 *
 * This example demonstrates how to:
 * 1. Connect to a Symbiotic Relay server
 * 2. Get the current epoch
 * 3. Calculate last committed epoch
 * 4. Get validator set information
 * 5. Sign a message
 * 6. Retrieve aggregation proofs
 * 7. Get individual signatures
 * 8. Get aggregation proofs by epoch
 * 9. Get signatures by epoch
 * 10. Get signature request IDs by epoch
 * 11. Get signature requests by epoch
 * 12. Get validator by key
 * 13. Get local validator
 * 14. Listen to signatures via streaming
 * 15. Listen to proofs via streaming
 * 16. Listen to validator set changes via streaming
 */

import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { SymbioticAPIService } from "@symbioticfi/relay-client-ts";
import {
  GetCurrentEpochRequestSchema,
  GetLastAllCommittedRequestSchema,
  SignMessageRequestSchema,
  GetAggregationProofRequestSchema,
  GetAggregationProofsByEpochRequestSchema,
  GetSignaturesRequestSchema,
  GetSignaturesByEpochRequestSchema,
  GetSignatureRequestIDsByEpochRequestSchema,
  GetSignatureRequestsByEpochRequestSchema,
  GetValidatorSetRequestSchema,
  GetValidatorByKeyRequestSchema,
  GetLocalValidatorRequestSchema,
  ListenSignaturesRequestSchema,
  ListenProofsRequestSchema,
  ListenValidatorSetRequestSchema,
  Signature,
  ChainEpochInfo,
} from "@symbioticfi/relay-client-ts";
import { create } from "@bufbuild/protobuf";

/**
 * Simple wrapper around the generated Connect client.
 */
export class RelayClient {
  private client: ReturnType<typeof createClient<typeof SymbioticAPIService>>;

  constructor(serverUrl: string = "http://localhost:8080") {
    const transport = createGrpcTransport({
      baseUrl: serverUrl,
    });
    this.client = createClient(SymbioticAPIService, transport);
    console.log(`Connected to Symbiotic Relay at ${serverUrl}`);
  }

  /**
   * Get the current epoch information.
   */
  async getCurrentEpoch() {
    const request = create(GetCurrentEpochRequestSchema);
    return await this.client.getCurrentEpoch(request);
  }

  /**
   * Get the last all committed epochs for all chains.
   */
  async getLastAllCommitted() {
    const request = create(GetLastAllCommittedRequestSchema);
    return await this.client.getLastAllCommitted(request);
  }

  /**
   * Sign a message using the specified key tag.
   */
  async signMessage(keyTag: number, message: Uint8Array, requiredEpoch?: bigint) {
    const request = create(SignMessageRequestSchema, {
      keyTag,
      message,
      requiredEpoch,
    });
    return await this.client.signMessage(request);
  }

  /**
   * Get aggregation proof for a specific request.
   */
  async getAggregationProof(requestId: string) {
    const request = create(GetAggregationProofRequestSchema, { requestId });
    return await this.client.getAggregationProof(request);
  }

  /**
   * Get individual signatures for a request.
   */
  async getSignatures(requestId: string) {
    const request = create(GetSignaturesRequestSchema, { requestId });
    return await this.client.getSignatures(request);
  }

  /**
   * Get validator set information.
   */
  async getValidatorSet(epoch?: bigint) {
    const request = create(GetValidatorSetRequestSchema, { epoch });
    return await this.client.getValidatorSet(request);
  }

  /**
   * Get aggregation proofs by epoch.
   */
  async getAggregationProofsByEpoch(epoch: bigint) {
    const request = create(GetAggregationProofsByEpochRequestSchema, { epoch });
    return await this.client.getAggregationProofsByEpoch(request);
  }

  /**
   * Get signatures by epoch.
   */
  async getSignaturesByEpoch(epoch: bigint) {
    const request = create(GetSignaturesByEpochRequestSchema, { epoch });
    return await this.client.getSignaturesByEpoch(request);
  }

  /**
   * Get signature request IDs by epoch.
   */
  async getSignatureRequestIDsByEpoch(epoch: bigint) {
    const request = create(GetSignatureRequestIDsByEpochRequestSchema, { epoch });
    return await this.client.getSignatureRequestIDsByEpoch(request);
  }

  /**
   * Get signature requests by epoch.
   */
  async getSignatureRequestsByEpoch(epoch: bigint) {
    const request = create(GetSignatureRequestsByEpochRequestSchema, { epoch });
    return await this.client.getSignatureRequestsByEpoch(request);
  }

  /**
   * Get validator by key.
   */
  async getValidatorByKey(keyTag: number, onChainKey: Uint8Array, epoch?: bigint) {
    const request = create(GetValidatorByKeyRequestSchema, { keyTag, onChainKey, epoch });
    return await this.client.getValidatorByKey(request);
  }

  /**
   * Get local validator.
   */
  async getLocalValidator(epoch?: bigint) {
    const request = create(GetLocalValidatorRequestSchema, { epoch });
    return await this.client.getLocalValidator(request);
  }

  /**
   * Listen to signatures in real-time via streaming response.
   */
  async *listenSignatures(startEpoch?: bigint) {
    const request = create(ListenSignaturesRequestSchema, { startEpoch });
    const stream = await this.client.listenSignatures(request);
    for await (const response of stream) {
      yield response;
    }
  }

  /**
   * Listen to aggregation proofs in real-time via streaming response.
   */
  async *listenProofs(startEpoch?: bigint) {
    const request = create(ListenProofsRequestSchema, { startEpoch });
    const stream = await this.client.listenProofs(request);
    for await (const response of stream) {
      yield response;
    }
  }

  /**
   * Listen to validator set changes in real-time via streaming response.
   */
  async *listenValidatorSet(startEpoch?: bigint) {
    const request = create(ListenValidatorSetRequestSchema, { startEpoch });
    const stream = await this.client.listenValidatorSet(request);
    for await (const response of stream) {
      yield response;
    }
  }
}

/**
 * Main example function demonstrating client usage.
 */
async function main() {
  // Initialize client
  const serverUrl = process.env.RELAY_SERVER_URL || "localhost:8080";
  const client = new RelayClient(serverUrl);

  try {
    // Example 1: Get current epoch
    console.log("=== Getting Current Epoch ===");
    const epochResponse = await client.getCurrentEpoch();
    console.log(`Current epoch: ${epochResponse.epoch}`);
    console.log(`Start time: ${epochResponse.startTime ? new Date(Number(epochResponse.startTime.seconds) * 1000) : 'N/A'}`);

    // Example 2: Get suggested epoch
    console.log("\n=== Calculate Last Committed Epoch ===");
    let suggestedEpoch = 0;
    const epochInfos = await client.getLastAllCommitted();
    for (const [chainId, info] of Object.entries(epochInfos.epochInfos)) {
      const chainInfo = info as ChainEpochInfo;
      console.log(`Chain ${chainId}: Last committed epoch ${chainInfo.lastCommittedEpoch}`);
      if (suggestedEpoch === 0 || Number(chainInfo.lastCommittedEpoch) < suggestedEpoch) {
        suggestedEpoch = Number(chainInfo.lastCommittedEpoch);
      }
    }
    console.log(`Suggested epoch (minimum): ${suggestedEpoch}`);

    // Example 3: Get validator set
    console.log("\n=== Getting Validator Set ===");
    const validatorSetResponse = await client.getValidatorSet();
    if (!validatorSetResponse.validatorSet) {
      console.log("No validator set found");
      return;
    }
    let validatorSet = validatorSetResponse.validatorSet;
    console.log(`Validator set version: ${validatorSet.version}`);
    console.log(`Epoch: ${validatorSet.epoch}`);
    console.log(`Status: ${validatorSet.status}`);
    console.log(`Number of validators: ${validatorSet.validators.length}`);
    console.log(`Quorum threshold: ${validatorSet.quorumThreshold}`);

    // Display some validator details
    if (validatorSet.validators.length > 0) {
      const firstValidator = validatorSet.validators[0];
      console.log(`First validator operator: ${firstValidator.operator}`);
      console.log(`First validator voting power: ${firstValidator.votingPower}`);
      console.log(`First validator is active: ${firstValidator.isActive}`);
      console.log(`First validator keys count: ${firstValidator.keys.length}`);
    }

    // Example 4: Sign a message
    console.log("\n=== Signing a Message ===");
    const messageToSign = new TextEncoder().encode("Hello, Symbiotic!");
    const keyTag = 15;

    const signResponse = await client.signMessage(keyTag, messageToSign);
    console.log(`Request ID: ${signResponse.requestId}`);
    console.log(`Epoch: ${signResponse.epoch}`);

    // Example 5: Get aggregation proof (this might fail if signing is not complete)
    console.log("\n=== Getting Aggregation Proof ===");
    try {
      const proofResponse = await client.getAggregationProof(signResponse.requestId);
      if (proofResponse.aggregationProof) {
        const proof = proofResponse.aggregationProof;
        console.log(`Request ID: ${proof.requestId}`);
        console.log(`Proof length: ${proof.proof.length} bytes`);
        console.log(`Message hash length: ${proof.messageHash.length} bytes`);
      }
    } catch (error: unknown) {
      console.log(`Could not get aggregation proof yet: ${(error as Error).message}`);
    }

    // Example 6: Get individual signatures
    console.log("\n=== Getting Individual Signatures ===");
    try {
      const signaturesResponse = await client.getSignatures(signResponse.requestId);
      console.log(`Number of signatures: ${signaturesResponse.signatures.length}`);

      signaturesResponse.signatures.forEach((signature: Signature, index: number) => {
        console.log(`Signature ${index + 1}:`);
        console.log(`  - Request ID: ${signature.requestId}`);
        console.log(`  - Signature length: ${signature.signature.length} bytes`);
        console.log(`  - Public key length: ${signature.publicKey.length} bytes`);
        console.log(`  - Message hash length: ${signature.messageHash.length} bytes`);
      });
    } catch (error: unknown) {
      console.log(`Could not get signatures yet: ${(error as Error).message}`);
    }

    // Example 7: Get aggregation proofs by epoch
    console.log("\n=== Getting Aggregation Proofs by Epoch ===");
    try {
      const proofsResponse = await client.getAggregationProofsByEpoch(BigInt(suggestedEpoch));
      console.log(`Number of proofs: ${proofsResponse.aggregationProofs.length}`);

      if (proofsResponse.aggregationProofs.length > 0) {
        const firstProof = proofsResponse.aggregationProofs[0];
        console.log(`First proof request ID: ${firstProof.requestId}`);
        console.log(`First proof message hash length: ${firstProof.messageHash.length} bytes`);
        console.log(`First proof data length: ${firstProof.proof.length} bytes`);
      }
    } catch (error: unknown) {
      console.log(`Could not get proofs by epoch: ${(error as Error).message}`);
    }

    // Example 8: Get signatures by epoch
    console.log("\n=== Getting Signatures by Epoch ===");
    try {
      const sigsByEpochResponse = await client.getSignaturesByEpoch(BigInt(suggestedEpoch));
      console.log(`Number of signatures in epoch ${suggestedEpoch}: ${sigsByEpochResponse.signatures.length}`);
    } catch (error: unknown) {
      console.log(`Could not get signatures by epoch: ${(error as Error).message}`);
    }

    // Example 9: Get signature request IDs by epoch
    console.log("\n=== Getting Signature Request IDs by Epoch ===");
    try {
      const requestIDsResponse = await client.getSignatureRequestIDsByEpoch(BigInt(suggestedEpoch));
      console.log(`Number of request IDs in epoch ${suggestedEpoch}: ${requestIDsResponse.requestIds.length}`);

      if (requestIDsResponse.requestIds.length > 0) {
        console.log(`First request ID: ${requestIDsResponse.requestIds[0]}`);
      }
    } catch (error: unknown) {
      console.log(`Could not get signature request IDs by epoch: ${(error as Error).message}`);
    }

    // Example 10: Get signature requests by epoch
    console.log("\n=== Getting Signature Requests by Epoch ===");
    try {
      const requestsResponse = await client.getSignatureRequestsByEpoch(BigInt(suggestedEpoch));
      console.log(`Number of signature requests in epoch ${suggestedEpoch}: ${requestsResponse.signatureRequests.length}`);

      if (requestsResponse.signatureRequests.length > 0) {
        const firstRequest = requestsResponse.signatureRequests[0];
        console.log(`First request details:`);
        console.log(`  - Request ID: ${firstRequest.requestId}`);
        console.log(`  - Key tag: ${firstRequest.keyTag}`);
        console.log(`  - Message length: ${firstRequest.message.length} bytes`);
        console.log(`  - Required epoch: ${firstRequest.requiredEpoch}`);
      }
    } catch (error: unknown) {
      console.log(`Could not get signature requests by epoch: ${(error as Error).message}`);
    }

    // Example 12: Get validator by key
    console.log("\n=== Getting Validator by Key ===");
    try {
      if (validatorSet.validators.length > 0 && validatorSet.validators[0].keys.length > 0) {
        const firstKey = validatorSet.validators[0].keys[0];
        const validatorByKey = await client.getValidatorByKey(firstKey.tag, firstKey.payload);
        console.log(`Validator operator: ${validatorByKey.validator?.operator}`);
        console.log(`Validator voting power: ${validatorByKey.validator?.votingPower}`);
      }
    } catch (error: unknown) {
      console.log(`Could not get validator by key: ${(error as Error).message}`);
    }

    // Example 13: Get local validator
    console.log("\n=== Getting Local Validator ===");
    try {
      const localValidator = await client.getLocalValidator();
      if (localValidator.validator) {
        console.log(`Local validator operator: ${localValidator.validator.operator}`);
        console.log(`Local validator voting power: ${localValidator.validator.votingPower}`);
        console.log(`Local validator is active: ${localValidator.validator.isActive}`);
        console.log(`Local validator keys count: ${localValidator.validator.keys.length}`);
      }
    } catch (error: unknown) {
      console.log(`Could not get local validator: ${(error as Error).message}`);
    }

    // Example 14: Listen to signatures (streaming)
    console.log("\n=== Listen to Signatures (Streaming) ===");
    console.log("Starting signature stream for 5 seconds...");
    try {
      const signatureStreamTimeout = setTimeout(() => {
        console.log("Signature stream timeout reached");
      }, 5000);

      let signatureCount = 0;
      for await (const sigResponse of client.listenSignatures(BigInt(suggestedEpoch))) {
        signatureCount++;
        console.log(`Received signature ${signatureCount}:`);
        console.log(`  Request ID: ${sigResponse.requestId}`);
        console.log(`  Epoch: ${sigResponse.epoch}`);
        console.log(`  Signature length: ${sigResponse.signature?.signature.length} bytes`);

        if (signatureCount >= 3) {
          clearTimeout(signatureStreamTimeout);
          break;
        }
      }
    } catch (error: unknown) {
      console.log(`Signature stream ended: ${(error as Error).message}`);
    }

    // Example 15: Listen to proofs (streaming)
    console.log("\n=== Listen to Proofs (Streaming) ===");
    console.log("Starting proof stream for 5 seconds...");
    try {
      const proofStreamTimeout = setTimeout(() => {
        console.log("Proof stream timeout reached");
      }, 5000);

      let proofCount = 0;
      for await (const proofResponse of client.listenProofs(BigInt(suggestedEpoch))) {
        proofCount++;
        console.log(`Received proof ${proofCount}:`);
        console.log(`  Request ID: ${proofResponse.requestId}`);
        console.log(`  Epoch: ${proofResponse.epoch}`);
        console.log(`  Proof length: ${proofResponse.aggregationProof?.proof.length} bytes`);

        if (proofCount >= 3) {
          clearTimeout(proofStreamTimeout);
          break;
        }
      }
    } catch (error: unknown) {
      console.log(`Proof stream ended: ${(error as Error).message}`);
    }

    // Example 16: Listen to validator set changes (streaming)
    console.log("\n=== Listen to Validator Set Changes (Streaming) ===");
    console.log("Starting validator set stream for 5 seconds...");
    try {
      const validatorSetStreamTimeout = setTimeout(() => {
        console.log("Validator set stream timeout reached");
      }, 5000);

      let vsCount = 0;
      for await (const vsResponse of client.listenValidatorSet(BigInt(suggestedEpoch))) {
        vsCount++;
        console.log(`Received validator set update ${vsCount}:`);
        console.log(`  Epoch: ${vsResponse.validatorSet?.epoch}`);
        console.log(`  Version: ${vsResponse.validatorSet?.version}`);
        console.log(`  Status: ${vsResponse.validatorSet?.status}`);
        console.log(`  Validators count: ${vsResponse.validatorSet?.validators.length}`);

        if (vsCount >= 2) {
          clearTimeout(validatorSetStreamTimeout);
          break;
        }
      }
    } catch (error: unknown) {
      console.log(`Validator set stream ended: ${(error as Error).message}`);
    }

  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code) {
      console.error(`gRPC error: ${err.code} - ${err.message}`);
    } else {
      console.error(`Error: ${(error as Error).message}`);
    }
  }

  console.log("\nExample completed");
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}