import { MessageImage } from '../value-objects/image.vo';
import { MessageText } from '../value-objects/message.vo';

export interface MessageProps {
    messageId?: number;
    publicId: string;
    senderUserId: number;
    receiverId: number;
    conversationId: number;
    text: MessageText;
    isRead: boolean;
    createdAt: Date;
    images: MessageImage[] | [];
}

export class Message {
    private constructor(private readonly props: MessageProps) { }

    static create(props: MessageProps): Message {
        return new Message(props);
    }

    get messageId() { return this.props.messageId; }
    get publicId() { return this.props.publicId; }
    get senderUserId() { return this.props.senderUserId; }
    get receiverUserId() { return this.props.receiverId; }
    get conversationId() { return this.props.conversationId; }
    get text() { return this.props.text; }
    get isRead() { return this.props.isRead; }
    get createdAt() { return this.props.createdAt; }
    get image() { return this.props.images; }

}