interface ImageMessageProps {
    imageId: number | null;
    publicId: string;
    url: string;
}

export class MessageImage {

    private constructor(private readonly props: ImageMessageProps) {

    }

    static create(props: ImageMessageProps): MessageImage {
        return new MessageImage(props);
    }

    get publicId(): string {
        return this.props.publicId
    }

    get url(): string {
        return this.props.url;
    }

    get imageId(): number | null {
        return this.props.imageId;
    }

}