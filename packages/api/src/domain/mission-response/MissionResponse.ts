export class MissionResponse {

  constructor(

    public responseId: number | null,

    public publicId: string,

    public missionId: number,

    public userId: number,

    public comment: string,

    public photoUrl: string | null,

    public status: string,

    public createdAt: Date

  ) {}

}