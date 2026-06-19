interface MatchResultsProps {
    id?: number;
    publicId: string;
    sourceReportId: number;
    candidateReportId: number;
    score: number;
}

export class MatchResultsEntity {

    constructor(private readonly props: MatchResultsProps) { }

    static create(props: MatchResultsProps): MatchResultsEntity {
        return new MatchResultsEntity(props);
    }

    get id() { return this.props.id; }
    get publicId() { return this.props.publicId; }
    get sourceReportId() { return this.props.sourceReportId; }
    get candidateReportId() { return this.props.candidateReportId; }
    get score() { return this.props.score; }
}