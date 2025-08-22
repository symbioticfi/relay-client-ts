#!/usr/bin/env node

/**
 * Basic usage example for the Symbiotic Relay TypeScript client.
 * 
 * This example demonstrates how to:
 * 1. Connect to a Symbiotic Relay server
 * 2. Get the current epoch
 * 3. Sign a message
 * 4. Retrieve aggregation proofs
 * 5. Get validator set information
 */

import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { SymbioticAPIService } from "@symbioticfi/relay-client-ts";
import {
  SigningStatus,
  GetCurrentEpochRequestSchema,
  GetSuggestedEpochRequestSchema,
  SignMessageRequestSchema,
  GetAggregationProofRequestSchema,
  GetSignaturesRequestSchema,
  GetValidatorSetRequestSchema,
  SignMessageWaitRequestSchema,
  Signature,
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
   * Get the suggested epoch for signing.
   */
  async getSuggestedEpoch() {
    const request = create(GetSuggestedEpochRequestSchema);
    return await this.client.getSuggestedEpoch(request);
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
  async getAggregationProof(requestHash: string) {
    const request = create(GetAggregationProofRequestSchema, { requestHash });
    return await this.client.getAggregationProof(request);
  }

  /**
   * Get individual signatures for a request.
   */
  async getSignatures(requestHash: string) {
    const request = create(GetSignaturesRequestSchema, { requestHash });
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
   * Sign a message and wait for aggregation via streaming response.
   */
  async *signMessageAndWait(keyTag: number, message: Uint8Array, requiredEpoch?: bigint) {
    const request = create(SignMessageWaitRequestSchema, {
      keyTag,
      message,
      requiredEpoch,
    });

    const stream = await this.client.signMessageWait(request);
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
    console.log("\n=== Getting Suggested Epoch ===");
    const suggestedEpoch = await client.getSuggestedEpoch();
    console.log(`Suggested epoch: ${suggestedEpoch.epoch}`);

    // Example 3: Get validator set
    console.log("\n=== Getting Validator Set ===");
    const validatorSet = await client.getValidatorSet();
    console.log(`Validator set version: ${validatorSet.version}`);
    console.log(`Epoch: ${validatorSet.epoch}`);
    console.log(`Status: ${validatorSet.status}`);
    console.log(`Number of validators: ${validatorSet.validators.length}`);

    // Display some validator details
    if (validatorSet.validators.length > 0) {
      const firstValidator = validatorSet.validators[0];
      console.log(`First validator operator: ${firstValidator.operator}`);
      console.log(`First validator voting power: ${firstValidator.votingPower}`);
      console.log(`First validator is active: ${firstValidator.isActive}`);
    }

    // Example 4: Sign a message
    console.log("\n=== Signing a Message ===");
    const messageToSign = new TextEncoder().encode("Hello, Symbiotic!");
    const keyTag = 15;

    const signResponse = await client.signMessage(keyTag, messageToSign);
    console.log(`Request hash: ${signResponse.requestHash}`);
    console.log(`Epoch: ${signResponse.epoch}`);

    // Example 5: Get aggregation proof (this might fail if signing is not complete)
    console.log("\n=== Getting Aggregation Proof ===");
    try {
      const proofResponse = await client.getAggregationProof(signResponse.requestHash);
      console.log(`Verification type: ${proofResponse.aggregationProof?.verificationType}`);
      console.log(`Proof length: ${proofResponse.aggregationProof?.proof.length} bytes`);
    } catch (error: unknown) {
      console.log(`Could not get aggregation proof yet: ${(error as Error).message} (expected as we did not wait for all relays to sign)`);
    }

    // Example 6: Get individual signatures
    console.log("\n=== Getting Individual Signatures ===");
    try {
      const signaturesResponse = await client.getSignatures(signResponse.requestHash);
      console.log(`Number of signatures: ${signaturesResponse.signatures.length}`);
      
      signaturesResponse.signatures.forEach((signature: Signature, index: number) => {
        console.log(`Signature ${index + 1}:`);
        console.log(`  - Signature length: ${signature.signature.length} bytes`);
        console.log(`  - Public key length: ${signature.publicKey.length} bytes`);
        console.log(`  - Message hash length: ${signature.messageHash.length} bytes`);
      });
    } catch (error: unknown) {
      console.log(`Could not get signatures yet: ${(error as Error).message}`);
    }

    // Example 7: Sign and wait for completion (streaming)
    console.log("\n=== Sign and Wait (Streaming) ===");
    const messageToSignStream = new TextEncoder().encode("Sample Message to Sign");

    console.log("Starting streaming sign request...(ensure to run the script for all active relay servers)");
    for await (const streamResponse of client.signMessageAndWait(keyTag, messageToSignStream)) {
      console.log(`Status: ${SigningStatus[streamResponse.status]}`);
      console.log(`Request hash: ${streamResponse.requestHash}`);

      switch (streamResponse.status) {
        case SigningStatus.PENDING:
          console.log("Request created, waiting for signatures...");
          break;

        case SigningStatus.COMPLETED:
          console.log("Signing completed!");
          if (streamResponse.aggregationProof) {
            console.log(`Proof length: ${streamResponse.aggregationProof.proof.length} bytes`);
            console.log(`Verification type: ${streamResponse.aggregationProof.verificationType}`);
          }
          return; // Exit the streaming loop

        case SigningStatus.FAILED:
          console.log("Failed to sign message");
          return;

        case SigningStatus.TIMEOUT:
          console.log("Signing timed out");
          return;

        default:
          console.log(`Unknown status: ${streamResponse.status}`);
          break;
      }

      // Add a small delay to make the output more readable
      await new Promise(resolve => setTimeout(resolve, 100));
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