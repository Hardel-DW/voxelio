import { describe, expect, it } from "vitest";
import { UIntDiff } from "../src/UIntDiff";

describe("UIntDiff", () => {
	const encoder = new TextEncoder();

	const createFile = (content: string): Uint8Array => encoder.encode(content);

	describe("added files", () => {
		it("should detect added files", () => {
			const original = { "file1.txt": createFile("content1") };
			const modified = {
				"file1.txt": createFile("content1"),
				"file2.txt": createFile("content2")
			};

			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.get("file2.txt")).toBe("added");
			expect(diff.getPaths()).toContain("file2.txt");
		});

		it("should detect multiple added files", () => {
			const original = {};
			const modified = {
				"file1.txt": createFile("content1"),
				"file2.txt": createFile("content2"),
				"file3.txt": createFile("content3")
			};

			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.get("file1.txt")).toBe("added");
			expect(changes.get("file2.txt")).toBe("added");
			expect(changes.get("file3.txt")).toBe("added");
			expect(diff.getPaths()).toHaveLength(3);
		});
	});

	describe("deleted files", () => {
		it("should detect deleted files", () => {
			const original = {
				"file1.txt": createFile("content1"),
				"file2.txt": createFile("content2")
			};

			const modified = { "file1.txt": createFile("content1") };
			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.get("file2.txt")).toBe("deleted");
			expect(diff.getPaths()).toContain("file2.txt");
		});

		it("should detect multiple deleted files", () => {
			const original = {
				"file1.txt": createFile("content1"),
				"file2.txt": createFile("content2"),
				"file3.txt": createFile("content3")
			};

			const modified = {};
			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.get("file1.txt")).toBe("deleted");
			expect(changes.get("file2.txt")).toBe("deleted");
			expect(changes.get("file3.txt")).toBe("deleted");
			expect(diff.getPaths()).toHaveLength(3);
		});
	});

	describe("modified files", () => {
		it("should detect modified files", () => {
			const original = { "file1.txt": createFile("content1") };
			const modified = { "file1.txt": createFile("modified content") };
			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.get("file1.txt")).toBe("modified");
			expect(diff.getPaths()).toContain("file1.txt");
		});

		it("should detect multiple modified files", () => {
			const original = {
				"file1.txt": createFile("content1"),
				"file2.txt": createFile("content2"),
				"file3.txt": createFile("content3")
			};
			const modified = {
				"file1.txt": createFile("modified1"),
				"file2.txt": createFile("modified2"),
				"file3.txt": createFile("modified3")
			};

			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.get("file1.txt")).toBe("modified");
			expect(changes.get("file2.txt")).toBe("modified");
			expect(changes.get("file3.txt")).toBe("modified");
			expect(diff.getPaths()).toHaveLength(3);
		});
	});

	describe("unchanged files", () => {
		it("should not include unchanged files", () => {
			const original = { "file1.txt": createFile("content1") };
			const modified = { "file1.txt": createFile("content1") };

			const diff = new UIntDiff(original, modified);
			expect(diff.getPaths()).toHaveLength(0);
			expect(diff.getChanges().size).toBe(0);
		});

		it("should not include unchanged files in mixed changes", () => {
			const original = {
				"file1.txt": createFile("content1"),
				"file2.txt": createFile("content2")
			};
			const modified = {
				"file1.txt": createFile("content1"),
				"file2.txt": createFile("modified2")
			};

			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.has("file1.txt")).toBe(false);
			expect(changes.get("file2.txt")).toBe("modified");
			expect(diff.getPaths()).toHaveLength(1);
		});
	});

	describe("mixed changes", () => {
		it("should detect all types of changes", () => {
			const original = {
				"unchanged.txt": createFile("same"),
				"modified.txt": createFile("old"),
				"deleted.txt": createFile("remove")
			};

			const modified = {
				"unchanged.txt": createFile("same"),
				"modified.txt": createFile("new"),
				"added.txt": createFile("new file")
			};

			const diff = new UIntDiff(original, modified);
			const changes = diff.getChanges();
			expect(changes.get("modified.txt")).toBe("modified");
			expect(changes.get("deleted.txt")).toBe("deleted");
			expect(changes.get("added.txt")).toBe("added");
			expect(changes.has("unchanged.txt")).toBe(false);
			expect(diff.getPaths()).toHaveLength(3);
		});
	});

	describe("edge cases", () => {
		it("should handle empty original and modified", () => {
			const diff = new UIntDiff({}, {});
			expect(diff.getPaths()).toHaveLength(0);
			expect(diff.getChanges().size).toBe(0);
		});

		it("should handle binary data", () => {
			const original = { "binary.dat": new Uint8Array([0, 1, 2, 3, 255]) };
			const modified = { "binary.dat": new Uint8Array([0, 1, 2, 4, 255]) };
			const diff = new UIntDiff(original, modified);
			expect(diff.getChanges().get("binary.dat")).toBe("modified");
		});

		it("should detect size differences", () => {
			const original = { "file.txt": createFile("short") };
			const modified = { "file.txt": createFile("much longer content") };
			const diff = new UIntDiff(original, modified);
			expect(diff.getChanges().get("file.txt")).toBe("modified");
		});

		it("should handle empty files", () => {
			const original = { "empty.txt": new Uint8Array() };
			const modified = { "empty.txt": new Uint8Array() };
			const diff = new UIntDiff(original, modified);
			expect(diff.getPaths()).toHaveLength(0);
		});

		it("should detect change from empty to non-empty", () => {
			const original = { "file.txt": new Uint8Array() };
			const modified = { "file.txt": createFile("content") };
			const diff = new UIntDiff(original, modified);
			expect(diff.getChanges().get("file.txt")).toBe("modified");
		});
	});

	describe("performance", () => {
		it("should handle large number of files efficiently", () => {
			const original: Record<string, Uint8Array> = {};
			const modified: Record<string, Uint8Array> = {};

			for (let i = 0; i < 100; i++) {
				original[`file${i}.txt`] = createFile(`content${i}`);
				modified[`file${i}.txt`] = i % 2 === 0 ? createFile(`content${i}`) : createFile(`modified${i}`);
			}

			const start = performance.now();
			const diff = new UIntDiff(original, modified);
			const end = performance.now();
			expect(diff.getPaths().length).toBe(50);
			expect(end - start).toBeLessThan(100);
		});

		it("should handle large files efficiently", () => {
			const largeContent = "x".repeat(100000);
			const original = { "large.txt": createFile(largeContent) };
			const modified = { "large.txt": createFile(`${largeContent}y`) };
			const start = performance.now();
			const diff = new UIntDiff(original, modified);
			const end = performance.now();
			expect(diff.getChanges().get("large.txt")).toBe("modified");
			expect(end - start).toBeLessThan(50);
		});
	});
});
