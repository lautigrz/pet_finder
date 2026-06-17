export interface ConversationSummaryOutput {
    publicId: string;
    otherUser: {
        publicId: string | null;
        username: string;
        photoUrl: string | null;
    };
    lastMessage: {
        text: string;
        isRead: boolean;
        createdAt: Date;
    } | null;
    createdAt: Date;
}