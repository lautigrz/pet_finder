export interface CreateConversationRequest {
    publicRequesterId: string;
    publicTargetId: string;
}

export interface CreateConversationOutput {
    publicId: string;
    createdAt: Date;
}
