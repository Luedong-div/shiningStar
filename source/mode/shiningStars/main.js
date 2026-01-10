import { lib, game, ui, get, _status } from "../../../../../noname.js";
import items from "./items.js";
import boss from "./boss.js";
import expandGame from "./game.js";
import expandGet from "./get.js";
import element from "./element.js";
import start from "./start.js";
import config from "./config.js";
import help from "./help.js";

async function shiningStarsMode() {
	game.addMode(
		"shiningStars",
		{
			splash: lib.assetURL + "extension/群星闪耀/assets/images/mode/shiningStars.png",
			start,
			element,
			boss,
			game: expandGame,
			skill: items.skill,
			translate: items.translate,
			get: expandGet,
			help,
		},
		{
			translate: "群星闪耀",
			extension: "群星闪耀",
			config,
		}
	);
}
export default shiningStarsMode;
