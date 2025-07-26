import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
const MAX_RETRIES = 3;
interface File {
  buffer: Buffer;
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000,
  secure: true,
});

export const uploadWithRetry = (file: File, folder: string, resourceType: 'image' | 'video' = 'image', retries: number = 0): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        resource_type: resourceType, 
        folder: folder 
      },
      (err, result) => {
        if (err) {
          if (retries < MAX_RETRIES) {
            console.log(`Retrying upload... Attempt ${retries + 1}`);
            return resolve(uploadWithRetry(file, folder, resourceType, retries + 1));
          }
          return reject(err);
        }
        if (result) {
          resolve(result); // resolve với result có kiểu UploadApiResponse
        } else {
          reject(new Error('No result from Cloudinary'));
        }
      }
    );
    stream.end(file.buffer);
  });
};

export default cloudinary;
