export type ContentSentenceKind = "PUBLICATION_REMOVED" | "ACCOUNT_SUSPENDED";

export class NotifyOwnerOfContentSentenceInput {
    constructor(
        public readonly ownerPublicId: string,
        public readonly kind: ContentSentenceKind,
        public readonly targetPublicId: string,
        public readonly motive: string | null = null,
    ) { }
}
