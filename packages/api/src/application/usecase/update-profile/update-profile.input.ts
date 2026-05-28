export class UpdateProfileInput{
    constructor(
        public readonly publicId: string,
        public readonly name?: string,
        public readonly lastname?: string,
        public readonly username?: string,
        public readonly photoUrl?: string,
    ){}
}