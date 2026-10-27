// DOS dates can only represent 1980-2107
const minDate = new Date(1980, 0, 1);
const maxDate = new Date(2107, 11, 31, 23, 59, 59);

export function formatDOSDateTime(date: Date, into: DataView, offset = 0): void {
	const year = date.getFullYear();
	const clamped = year < 1980 ? minDate : year > 2107 ? maxDate : date;
	const dosTime = (clamped.getSeconds() >> 1) | (clamped.getMinutes() << 5) | (clamped.getHours() << 11);
	const dosDate = clamped.getDate() | ((clamped.getMonth() + 1) << 5) | ((clamped.getFullYear() - 1980) << 9);
	into.setUint16(offset, dosTime, true);
	into.setUint16(offset + 2, dosDate, true);
}
