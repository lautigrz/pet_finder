

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
}

export interface ConversationOutput {
    publicId: string;
    otherUser: UserOutput;
    messages: MessageOutput[];
    createdAt: Date;
}