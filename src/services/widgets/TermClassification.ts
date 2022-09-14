export interface TermClassification {
    params: {
        name: string;
        help: string;
    };
    data: TermClassificationItem[];
}

export interface TermClassificationItem {
    data: {
        column: string;
        terms: string[];
    };
}
