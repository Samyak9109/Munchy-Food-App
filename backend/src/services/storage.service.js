import config from "../config/config.js";
import ImageKit from "@imagekit/nodejs";
import fs from "fs";
import os from "os";
import path from "path";

const client = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

const uploadToImagekit = async (file) => {
  // write buffer to a temp file → stream it → delete it
  const tempPath = path.join(os.tmpdir(), `${Date.now()}_${file.originalname}`);

  try {
    fs.writeFileSync(tempPath, file.buffer); // buffer → temp file

    const result = await client.files.upload({
      file: fs.createReadStream(tempPath), // stream temp file to imagekit
      fileName: `${Date.now()}_${file.originalname}`,
      folder: "/food-delivery",
      useUniqueFileName: true,
    });

    return result.url;
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  } finally {
    // always delete temp file whether upload succeeded or failed
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
};

export default uploadToImagekit;
