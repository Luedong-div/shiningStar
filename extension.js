import { lib, game, ui, get, ai, _status } from "../../noname.js";
import { arenaReady } from "./source/arenaReady.js";
import { content } from "./source/content.js";
import { prepare } from "./source/prepare.js";
import { precontent } from "./source/precontent.js";
import { config } from "./source/config.js";
import { help } from "./source/help.js";
import { basic } from "./source/basic.js";

export const type = "extension";

export default async function () {
	const extensionInfo = await lib.init.promises.json(`${basic.extensionDirectoryPath}info.json`);
	const extension = {
		name: extensionInfo.name,
		arenaReady,
		content,
		prepare,
		precontent,
		config: await basic.resolve(config),
		help: await basic.resolve(help),
		editable: false,
		connect: false,
		package: {},
	};

	Object.keys(extensionInfo)
		.filter(key => key !== "name")
		.forEach(key => {
			extension.package[key] = extensionInfo[key];
		});

	return extension;
}
