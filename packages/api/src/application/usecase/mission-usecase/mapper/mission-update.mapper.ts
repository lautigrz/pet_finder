import { MissionUpdate } from "@domain/mission/MissionUpdate";
import { MissionUpdateOutput } from "../dto/mission-update.dto";

export type UserOutput = {

    public_id: string;
    username: string;
    photoUrl: string | null;

}

export class MissionUpdateMapper {

    static toOutput(update: MissionUpdate, user: UserOutput): MissionUpdateOutput {
        return {
            publicId: update.publicId,
            comment: update.comment,
            photoUrl: update.photoUrl,
            status: update.status,
            createdAt: update.createdAt.toISOString(),
            user: {
                publicId: user.public_id,
                username: user.username,
                photoUrl: user.photoUrl
            }
        }
    }
}