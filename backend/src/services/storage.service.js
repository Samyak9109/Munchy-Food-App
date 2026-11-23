import config from "../config/config.js";
import ImageKit, { toFile } from "@imagekit/nodejs";

const client = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

export const uploadToImagekit = async (file) => {
  try {
    const fileName = `${Date.now()}_${file.originalname || "upload"}`;
    // Convert memory buffer directly to a File object, eliminating disk I/O
    const uploadFile = await toFile(file.buffer, fileName);

    const result = await client.files.upload({
      file: uploadFile,
      fileName,
      folder: "/food-delivery",
      useUniqueFileName: true,
    });

    return result.url;
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

export default uploadToImagekit;
