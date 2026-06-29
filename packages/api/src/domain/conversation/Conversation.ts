interface ConversationProps {
    conversationId?: number;
    publicId: string;
    userOneId: number;
    userTwoId: number;
    createdAt: Date;
}

export class Conversation {
    private constructor(private readonly props: ConversationProps) { }

    static create(props: ConversationProps): Conversation {
        const conversation = new Conversation(props);
        conversation.normalizeParticipants();
        return conversation;
    }

    hasParticipant(userId: number): boolean {
        return this.props.userOneId === userId || this.props.userTwoId === userId;
    }

    getOtherParticipant(userId: number): number {
        if (!this.hasParticipant(userId)) throw new Error('User is not part of this conversation');
        return this.props.userOneId === userId ? this.props.userTwoId : this.props.userOneId;
    }

    private normalizeParticipants() {
        if (this.props.userOneId > this.props.userTwoId) {
            [this.props.userOneId, this.props.userTwoId] = [this.props.userTwoId, this.props.userOneId];
        }
    }

    get conversationId() { return this.props.conversationId; }
    get publicId() { return this.props.publicId; }
    get userOneId() { return this.props.userOneId; }
    get userTwoId() { return this.props.userTwoId; }
    get createdAt() { return this.props.createdAt; }
}