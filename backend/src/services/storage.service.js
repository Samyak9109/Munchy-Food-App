import config from "../config/config.js";
import ImageKit from "@imagekit/nodejs";

const client = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

const uploadToImagekit = async (file) => {
  try {
    const result = await client.files.upload({
      file: file.buffer, // pass buffer directly
      fileName: `${Date.now()}_${file.originalname}`,
      folder: "/food-delivery",
      useUniqueFileName: true,
    });
    return result.url;
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

export default uploadToImagekit;
