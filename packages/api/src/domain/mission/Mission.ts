export class Mission {

  constructor(
    public missionId: number | null,
    public publicId: string,
    public reportId: number,
    public latitude: number,
    public longitude: number,
    public radius: number,

    public title: string,
    public description: string,

    public status: string,
    public createdAt: Date,
    public updatedAt: Date | null
  ) {}

}