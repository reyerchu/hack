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

    // Step 2: Create a temporary directory for metadata files
    const tempDir = path.join(os.tmpdir(), `nft-metadata-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('[IPFS Upload] Created temp directory:', tempDir);

    try {
      // Step 3: Generate metadata JSON files for each token
      const totalSupply = parseInt(maxSupply || '100', 10);

      for (let i = 1; i <= totalSupply; i++) {
        const metadata = {
          name: `${name} #${i}`,
          description: description || `${name} NFT Collection`,
          image: imageURL,
          attributes: [
            {
              trait_type: 'Edition',
              value: `${i} of ${totalSupply}`,
            },
            {
              trait_type: 'Collection',
              value: name,
            },
          ],
        };

        // Write each token's metadata to a separate file
        const filePath = path.join(tempDir, `${i}.json`);
        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
      }

      console.log('[IPFS Upload] Created', totalSupply, 'metadata files');
      console.log('[IPFS Upload] Uploading metadata folder to Pinata...');

      // Step 4: Upload directory using HTTP API with proper structure
      // Create FormData with all files
      const metadataFormData = new FormData();
      
      const files = fs.readdirSync(tempDir).sort((a, b) => {
        return parseInt(a) - parseInt(b);
      });

      // Add all JSON files to FormData
      // The key is to append each file with the SAME field name 'file'
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        metadataFormData.append('file', fs.createReadStream(filePath), {
          filename: file,  // Just the filename, not a path
        });
      }

      // Add pinata options AFTER all files
      metadataFormData.append('pinataOptions', JSON.stringify({
        wrapWithDirectory: true,
      }));

      metadataFormData.append('pinataMetadata', JSON.stringify({
        name: `${name}-metadata-${Date.now()}`,
      }));

      // Upload using HTTP API
      const metadataUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
          ...metadataFormData.getHeaders(),
        },
        body: metadataFormData,
      });

      if (!metadataUploadResponse.ok) {
        const errorText = await metadataUploadResponse.text();
        console.error('[IPFS Upload] Metadata upload error:', errorText);
        throw new Error(`Metadata folder upload failed: ${errorText}`);
      }

      const metadataResult = await metadataUploadResponse.json();
      const metadataCID = metadataResult.IpfsHash;
      
      // BaseURI format: ipfs://CID/
      // Contract will append: tokenId + ".json"
      // Full URI example: ipfs://CID/1.json
      // This now correctly resolves to an individual 1.json file in the IPFS folder
      const baseURI = `ipfs://${metadataCID}/`;

      console.log('[IPFS Upload] Metadata folder uploaded:', metadataCID);

      // Cleanup temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('[IPFS Upload] Cleaned up temp directory');

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
        fs.rmSync(tempDir, { recursive: true, force: true });
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
