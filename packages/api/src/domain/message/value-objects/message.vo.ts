import { InvalidMessageTextError } from "@domain/errors/InvalidMessageTextError";

export class MessageText {
    private constructor(
        private readonly value: string,
    ) { }

    static create(text: string): MessageText {
        MessageText.validate(text);
        return new MessageText(text);
    }

    private static validate(text: string): void {
        if (text.trim().length === 0) {
            throw new InvalidMessageTextError('Message text cannot be empty');
        }

        if (text.length > 1000) {
            throw new InvalidMessageTextError('Message text cannot exceed 1000 characters');
        }

        if (MessageText.containsPhone(text)) {
            throw new InvalidMessageTextError('Message text cannot contain phone numbers');
        }

        if (MessageText.containsEmail(text)) {
            throw new InvalidMessageTextError('Message text cannot contain email addresses');
        }
    }

    private static containsPhone(text: string): boolean {

        const phoneRegex = /(\+?\d[\d\s\-().]{7,}\d)/g;
        const matches = text.match(phoneRegex) ?? [];
        return matches.some(m => m.replace(/\D/g, '').length >= 7);
    }

    private static containsEmail(text: string): boolean {
        const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
        return emailRegex.test(text);
    }

    getValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}