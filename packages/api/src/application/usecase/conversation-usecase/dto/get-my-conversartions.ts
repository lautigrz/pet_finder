export interface ConversationSummaryOutput {
    publicId: string;
    otherUser: {
        publicId: string;
        username: string;
        photoUrl: string | null;  // ← agregar null
    };
    lastMessage: {
        text: string;
        isRead: boolean;
        createdAt: Date;
    } | null;
    createdAt: Date;
}