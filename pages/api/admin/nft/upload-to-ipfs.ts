import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PinataSDK } from 'pinata-web3';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Disable Next.js body parsing (we'll use formidable)
export const config = {
  api: {
    bodyParser: false,
  },
};

interface IPFSUploadResult {
  success: boolean;
  imageCID?: string;
  metadataCID?: string;
  baseURI?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IPFSUploadResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check for Pinata API credentials
    const pinataJWT = process.env.PINATA_JWT;
    const pinataGateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

    if (!pinataJWT) {
      return res.status(500).json({
        success: false,
        error: '❌ PINATA_JWT 環境變數未設置。請在 .env.local 中添加 Pinata API 金鑰。',
      });
    }

    // Parse the multipart form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    // Extract metadata
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const maxSupply = Array.isArray(fields.maxSupply) ? fields.maxSupply[0] : fields.maxSupply;

    // Get the uploaded image file
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        error: '❌ 未找到圖片文件',
      });
    }

    console.log('[IPFS Upload] Uploading image to Pinata...');

    // Initialize Pinata SDK (used for both image and metadata uploads)
    const pinata = new PinataSDK({
      pinataJwt: pinataJWT,
    });

    // Step 1: Upload image to IPFS using Pinata SDK
    // Use the file path directly - Pinata SDK can handle file paths
    const imageStream = fs.createReadStream(imageFile.filepath);
    
    const imageResult = await pinata.upload.stream(imageStream);
    const imageCID = imageResult.IpfsHash;
    const imageURL = `ipfs://${imageCID}`;

    console.log('[IPFS Upload] Image uploaded:', imageCID);

    // Step 2: Create a single metadata JSON file
    // Since all NFTs share the same image, we only need one metadata file
    console.log('[IPFS Upload] Creating single metadata file...');

    const metadata = {
      name: name,
      description: description || `${name} NFT Collection`,
      image: imageURL,
      attributes: [
        {
          trait_type: 'Collection',
          value: name,
        },
      ],
    };

    // Create a temporary file for the metadata
    const tempFilePath = path.join(os.tmpdir(), `metadata-${Date.now()}.json`);
    fs.writeFileSync(tempFilePath, JSON.stringify(metadata, null, 2));

    try {
      // Step 3: Upload single metadata file using Pinata SDK
      console.log('[IPFS Upload] Uploading metadata to Pinata...');
      
      const metadataStream = fs.createReadStream(tempFilePath);
      const metadataResult = await pinata.upload.stream(metadataStream);
      const metadataCID = metadataResult.IpfsHash;
      
      // BaseURI format: ipfs://CID
      // All tokens will use the same metadata URI
      // The contract will use this as the base URI for ALL tokens
      const baseURI = `ipfs://${metadataCID}`;

      console.log('[IPFS Upload] Metadata uploaded:', metadataCID);
      console.log('[IPFS Upload] All NFTs will share this metadata');

      // Cleanup temp file
      fs.unlinkSync(tempFilePath);
      console.log('[IPFS Upload] Cleaned up temp file');

      // Cleanup image temp file
      fs.unlinkSync(imageFile.filepath);

      // Return success
      return res.status(200).json({
        success: true,
        imageCID,
        metadataCID,
        baseURI,
      });
    } catch (metadataError: any) {
      // Cleanup on error
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
      throw metadataError;
    }
  } catch (error: any) {
    console.error('[IPFS Upload] Error:', error);
    
    // Cleanup image file if exists
    try {
      if (imageFile?.filepath) {
        fs.unlinkSync(imageFile.filepath);
      }
    } catch {}
    
    return res.status(500).json({
      success: false,
      error: error.message || '上傳到 IPFS 失敗',
    });
  }
}
