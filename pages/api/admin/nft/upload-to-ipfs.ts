import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
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

    // Step 1: Upload image to IPFS using Pinata API
    const imageFormData = new FormData();
    imageFormData.append('file', fs.createReadStream(imageFile.filepath));

    const imageUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
        ...imageFormData.getHeaders(),
      },
      body: imageFormData,
    });

    if (!imageUploadResponse.ok) {
      const error = await imageUploadResponse.text();
      throw new Error(`Image upload failed: ${error}`);
    }

    const imageResult = await imageUploadResponse.json();
    const imageCID = imageResult.IpfsHash;
    const imageURL = `ipfs://${imageCID}`;

    console.log('[IPFS Upload] Image uploaded:', imageCID);

    // Step 2: Generate metadata JSON for each token
    const metadataFiles: { [key: string]: any } = {};
    const totalSupply = parseInt(maxSupply || '100', 10);

    for (let i = 1; i <= totalSupply; i++) {
      metadataFiles[`${i}.json`] = {
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
    }

    console.log('[IPFS Upload] Uploading metadata to Pinata...');

    // Step 3: Upload metadata JSON to IPFS
    // Note: This uploads a single JSON object containing all token metadata
    // The smart contract's tokenURI function will append the tokenId + ".json"
    // and OpenSea/marketplaces will resolve: ipfs://CID/1.json -> the "1.json" property in the JSON
    const metadataUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: metadataFiles,
        pinataMetadata: {
          name: `${name}-metadata-collection`,
        },
      }),
    });

    if (!metadataUploadResponse.ok) {
      const error = await metadataUploadResponse.text();
      throw new Error(`Metadata upload failed: ${error}`);
    }

    const metadataResult = await metadataUploadResponse.json();
    const metadataCID = metadataResult.IpfsHash;
    
    // BaseURI format: ipfs://CID/
    // Contract will append: tokenId + ".json"
    // Full URI example: ipfs://CID/1.json
    // This resolves to the "1.json" property in the uploaded JSON object
    const baseURI = `ipfs://${metadataCID}/`;

    console.log('[IPFS Upload] Metadata uploaded:', metadataCID);

    // Cleanup temp file
    fs.unlinkSync(imageFile.filepath);

    // Return success
    return res.status(200).json({
      success: true,
      imageCID,
      metadataCID,
      baseURI,
    });
  } catch (error: any) {
    console.error('[IPFS Upload] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '上傳到 IPFS 失敗',
    });
  }
}
