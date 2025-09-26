export function toRoman(num: number) {
	const roman = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
	const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
	let result = "";
	let currentNum = num;

	for (let i = 0; i < roman.length; i++) {
		while (currentNum >= values[i]) {
			result += roman[i];
			currentNum -= values[i];
		}
	}
	return result;
}
