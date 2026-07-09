interface Props {
    points: number;
    label: string;
}

export class PointValue {
    private readonly _props: Props;

    private constructor(props: Props) {
        this._props = props;
    }

    static create(props: Props): PointValue {
        if (!Number.isInteger(props.points) || props.points <= 0) {
            throw new Error("Points must be a positive integer");
        }
        if (!props.label || props.label.trim().length === 0) {
            throw new Error("Label is required");
        }
        return new PointValue(props);
    }

    get points(): number {
        return this._props.points;
    }

    get label(): string {
        return this._props.label;
    }

    equals(other: PointValue): boolean {
        return this._props.points === other._props.points;
    }
}