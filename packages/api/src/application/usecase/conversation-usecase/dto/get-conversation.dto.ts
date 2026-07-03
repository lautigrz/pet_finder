

interface UserOutput {
    publicId: string;
    username: string;
    photoUrl: string;
}

interface MessageOutput {
    publicId: string;
    text: string;
    senderId: string;
    isRead: boolean;
    createdAt: Date;
    images?: Array<{ publicId: string; url: string }>;
}

export interface ConversationOutput {
    publicId: string;
    otherUser: UserOutput;
    messages: MessageOutput[];
    createdAt: Date;
    isSuspended: boolean;
}