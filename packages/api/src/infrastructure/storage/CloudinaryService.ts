import { StorageService } from "@application/ports/StorageService";
import { cloudinary } from "./CloudinaryConfig";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";


export class ClaudinaryService implements StorageService {

    async upload(buffer: Buffer, folder?: string): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder },
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Cloudinary no devolvió resultado'));

                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            );

            stream.end(buffer);
        });
    }
    async delete(publicId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Cloudinary no devolvió resultado'));

                resolve();
            });
        });
    }
}