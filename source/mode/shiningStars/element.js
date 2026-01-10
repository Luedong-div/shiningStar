import { lib, game, ui, get, _status } from "../../../../../noname.js";
import BoostStore from "./class/BoostStore.js";

export default {
	player: {
		async dieAfter() {
			if (this != game.boss) {
				this.storage.boss_chongzheng = 0;
			}
			if (game.bossinfo.global.checkResult && game.bossinfo.global.checkResult(this) === false) {
				return;
			}
			if (!game.boss.isAlive() && game.bossinfo?.convo?.playConvoAfter) {
				const convo = typeof game.bossinfo.convo.playConvoAfter === "function" ? game.bossinfo.convo.playConvoAfter() : game.bossinfo.convo.playConvoAfter;
				game.playConvo(convo);
			}
			if (this == game.boss || !game.hasPlayer(current => !current.side, true)) {
				await game.checkResult();
				if (game.bossinfo.checkPerfect && game.bossinfo.checkPerfect()) {
					// 广播待补充
					const currentData = await BoostStore.read();
					const items = game.bossinfo.items || [];
					for (const item of items) {
						const names = Array.isArray(item.name) ? item.name : [item.name];
						if (Math.random() < item.possibility) {
							currentData.boostItem.addArray(names);
							BoostStore.write(currentData);
						}
					}
				}
			}
		},
		// 道具系统
		addItem(key) {
			if (!this.items) {
				this.items = [];
			}
			if (Array.isArray(key)) {
				this.items.addArray(key);
			} else {
				this.items.push(key);
			}
			this.addSkills(key);
		},
		hasItem(key) {
			return this.items?.includes(key);
		},
		removeItem(key) {
			if (!this.items) return;
			if (Array.isArray(key)) {
				this.items = this.items.filter(item => !key.includes(item));
			} else {
				this.items.remove(key);
			}
			this.removeSkills(key);
		},
		getItems() {
			return this.items || [];
		},
	},
};
