import { lib, game, ui, get, _status } from "../../../../../noname.js";

export default {
	rawAttitude(from, to) {
		const num = to.identity == "zhong" ? 5 : 6;
		return from.side === to.side ? num : -num;
	},
};
