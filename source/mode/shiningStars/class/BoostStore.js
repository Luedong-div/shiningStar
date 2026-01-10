import { lib, game, ui, get, _status } from "../../../../../../noname.js";
const fs = globalThis.require("fs/promises");
const path = globalThis.require("path");

const currentFile = lib.init.getCurrentFileLocation(import.meta.url);
const currentFileAbs = path.isAbsolute(currentFile) ? currentFile : path.join(__dirname, currentFile);
const jsonFilePath = path.join(path.dirname(path.dirname(currentFileAbs)), "data.json");

class BoostStore {
	static DEFAULT_DATA = {
		boostItem: ["shiningStars_eternalStars"],
		currentLevel: 1,
	};

	static get path() {
		return jsonFilePath;
	}

	static async ensureFile() {
		try {
			await fs.access(this.path);
		} catch (err) {
			await fs.mkdir(path.dirname(this.path), { recursive: true });
			await fs.writeFile(this.path, JSON.stringify(this.DEFAULT_DATA, null, 2), "utf8");
		}
	}

	static async read() {
		await this.ensureFile();
		const raw = await fs.readFile(this.path, "utf8");
		return JSON.parse(raw);
	}

	static async write(data) {
		await fs.writeFile(this.path, JSON.stringify(data, null, 2), "utf8");
	}

	static async set(key, value) {
		try {
			const data = await this.read();
			data[key] = value;
			await this.write(data);
			return data;
		} catch (err) {
			throw err;
		}
	}

	static async removeFile() {
		try {
			await fs.rm(this.path, { force: true });
		} catch (err) {
			throw err;
		}
	}

	static async add(key, value) {
		try {
			const data = await this.read();
			if (!Array.isArray(data[key])) {
				data[key] = [];
			}
			if (!data[key].includes(value)) {
				data[key].push(value);
				await this.write(data);
			}
			return data;
		} catch (err) {
			throw err;
		}
	}

	static async remove(key, value) {
		try {
			const data = await this.read();
			if (Array.isArray(data[key])) {
				data[key] = data[key].filter(item => item !== value);
				await this.write(data);
			}
			return data;
		} catch (err) {
			throw err;
		}
	}
}
export default BoostStore;
