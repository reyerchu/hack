import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { ethers } from 'ethers';

/**
 * Merkle Tree utilities for NFT whitelist
 * Uses email hashes instead of wallet addresses for privacy and flexibility
 */

/**
 * Hash an email address for Merkle Tree
 * @param email - Email address to hash
 * @returns Hashed email as hex string
 */
export function hashEmail(email: string): string {
  // Normalize email (lowercase, trim)
  const normalized = email.toLowerCase().trim();
  // Use keccak256 (same as Solidity)
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalized));
}

/**
 * Create a Merkle Tree from a list of emails
 * @param emails - Array of email addresses
 * @returns MerkleTree instance and root
 */
export function createMerkleTree(emails: string[]): {
  tree: MerkleTree;
  root: string;
} {
  // Hash all emails
  const leaves = emails.map((email) => hashEmail(email));

  // Create Merkle Tree
  const tree = new MerkleTree(leaves, keccak256, {
    sortPairs: true,
    hashLeaves: false, // We already hashed the leaves
  });

  const root = tree.getHexRoot();

  return { tree, root };
}

/**
 * Generate Merkle Proof for an email
 * @param email - Email address to generate proof for
 * @param emails - Full list of whitelisted emails
 * @returns Merkle proof as hex strings, or null if email not in list
 */
export function generateMerkleProof(email: string, emails: string[]): string[] | null {
  const { tree } = createMerkleTree(emails);
  const leaf = hashEmail(email);

  // Check if email is in the list
  if (!emails.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim())) {
    return null;
  }

  const proof = tree.getHexProof(leaf);
  return proof;
}

/**
 * Verify a Merkle Proof (for testing)
 * @param email - Email to verify
 * @param proof - Merkle proof
 * @param root - Merkle root
 * @returns true if proof is valid
 */
export function verifyMerkleProof(email: string, proof: string[], root: string): boolean {
  const leaf = hashEmail(email);
  return MerkleTree.verify(proof, leaf, root, keccak256, { sortPairs: true });
}

/**
 * Export Merkle Tree data for storage
 * @param emails - List of whitelisted emails
 * @returns Object containing root and mapping of email -> proof
 */
export function exportMerkleTreeData(emails: string[]): {
  root: string;
  proofs: Record<string, string[]>;
} {
  const { tree, root } = createMerkleTree(emails);
  const proofs: Record<string, string[]> = {};

  // Generate proof for each email
  emails.forEach((email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const leaf = hashEmail(normalizedEmail);
    proofs[normalizedEmail] = tree.getHexProof(leaf);
  });

  return { root, proofs };
}
