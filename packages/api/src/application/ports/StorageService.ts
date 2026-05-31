export interface StorageService {
    upload(buffer: Buffer, folder?: string): Promise<{ url: string; publicId: string }>;
    delete(publicId: string): Promise<void>;
}