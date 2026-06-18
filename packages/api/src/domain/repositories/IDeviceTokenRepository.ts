export interface IDeviceTokenRepository {
    registerForUser(userPublicId: string, token: string): Promise<void>;
    removeForUser(userPublicId: string, token: string): Promise<void>;
    findTokensByUser(userPublicId: string): Promise<string[]>;
}
