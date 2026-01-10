import { lib } from "../../../noname.js";

const basicPath = lib.init.getCurrentFileLocation(import.meta.url);

export const basic = {
	extensionDirectoryPath: basicPath.slice(0, basicPath.lastIndexOf("source/basic.js")),
	resolve(obj) {
		if (typeof obj === "function") {
			return Promise.resolve(obj());
		}
		return Promise.resolve(obj);
	},
};
