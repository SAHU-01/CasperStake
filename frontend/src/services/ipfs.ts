// src/services/ipfs.ts
// Production IPFS service using Pinata

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET = process.env.NEXT_PUBLIC_PINATA_SECRET || '';
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadToIPFS(data: any, name?: string): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET) {
    console.warn('Pinata not configured, using hash fallback');
    return hashFallback(data);
  }

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: name || `casperstake-${Date.now()}`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Pinata error:', error);
      throw new Error(`IPFS upload failed: ${error}`);
    }

    const result: PinataResponse = await response.json();
    console.log('✅ Uploaded to IPFS:', result.IpfsHash);
    return result.IpfsHash;
  } catch (error) {
    console.error('IPFS upload error:', error);
    return hashFallback(data);
  }
}

/**
 * Fetch JSON from IPFS
 */
export async function fetchFromIPFS<T = any>(cid: string): Promise<T | null> {
  if (!cid) return null;
  
  try {
    const response = await fetch(`${IPFS_GATEWAY}/${cid}`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`IPFS fetch failed for ${cid}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('IPFS fetch error:', error);
    return null;
  }
}

/**
 * Get full IPFS URL
 */
export function getIPFSUrl(cid: string): string {
  if (!cid) return '';
  return `${IPFS_GATEWAY}/${cid}`;
}

/**
 * Check if Pinata is configured
 */
export function isIPFSConfigured(): boolean {
  return !!(PINATA_API_KEY && PINATA_SECRET);
}

/**
 * Fallback: generate hash for data (when IPFS not available)
 */
async function hashFallback(data: any): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(jsonString));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 46);
}