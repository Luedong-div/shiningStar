import { lib, game, ui, get, _status } from "../../../../../noname.js";
import Auxiliary from "./class/Auxiliary.js";

/** @type { importCharacterConfig['skill'] } */

export default async function start(event) {
	const auxiliary = new Auxiliary();
	await auxiliary.prepareStage();
	await auxiliary.launchEncounter(event);
	if (game.bossinfo?.convo?.playConvoBefore) {
		const convo = typeof game.bossinfo.convo.playConvoBefore === "function" ? game.bossinfo.convo.playConvoBefore() : game.bossinfo.convo.playConvoBefore;
		await game.playConvo(convo);
	}
	game.addGlobalSkill("viewSideHandCards");
	await game.bossPhaseLoop();
}
