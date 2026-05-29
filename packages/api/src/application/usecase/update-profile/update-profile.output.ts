export class UpdateProfileOutput{
    constructor(
        public readonly id:string,
        public readonly email: string,
        public readonly username: string,
        public readonly name: string | null,
        public readonly lastname: string | null,
        public readonly photoUrl: string | null,
    )
    {}
}