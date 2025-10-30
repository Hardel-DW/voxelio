// Generates a random integer in the inclusive range [min, max].
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}