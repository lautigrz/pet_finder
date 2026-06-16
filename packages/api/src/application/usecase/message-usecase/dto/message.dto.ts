
export interface SendMessageRequest {
    publicUserId: string;
    publicConversationId: string;
    text: string;
}

export interface MessageOutput {
    publicId: string;
    text: string;
    senderId: string;
    receiverId: string;
    isRead: boolean;
    createdAt: Date;
}