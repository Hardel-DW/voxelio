export class DatapackError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DatapackError";
    }
}
