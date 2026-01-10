import { lib, game, ui, get, _status } from "../../../../../../noname.js";
import BoostStore from "./BoostStore.js";

class Auxiliary {
	// bosslist UI 创建
	async showBossList() {
		lib.translate.restart = "返回";
		lib.init.css(lib.assetURL + "layout/mode", "boss");
		_status.banlist ??= {};
		let bosslist = ui.create.div("#bosslist.hidden");
		lib.setScroll(bosslist);
		if (!lib.config.touchscreen && lib.config.mousewheel) {
			bosslist._scrollspeed = 30;
			bosslist._scrollnum = 10;
			bosslist.onmousewheel = ui.click.mousewheel;
		}
		let onpause = () => ui.window.classList.add("bosspaused");
		let onresume = () => ui.window.classList.remove("bosspaused");
		game.onpause = onpause;
		game.onpause2 = onpause;
		game.onresume = onresume;
		game.onresume2 = onresume;
		ui.create.div(bosslist); // 占位
		const data = await BoostStore.read();
		const level = data.currentLevel;
		lib.storage.current ??= "shiningStars_level1";
		let list = [];
		for (const [index, name] of lib.boss.shiningStarsBossList.entries()) {
			const stageNumber = index + 1;
			const locked = stageNumber > level;
			const player = this._createStageEntry(bosslist, name, stageNumber, locked);
			if (!locked && lib.storage.current == name) {
				_status.current = player;
				player.classList.add("highlight");
			}
			list.push(player);
		}
		if (!list.length) {
			alert("关卡加载失败！");
			lib.init.onfree();
			_status.over = true;
			return;
		}
		if (!_status.current) {
			_status.current = bosslist.childNodes[1];
			if (_status.current) {
				_status.current.classList.add("highlight");
			}
		}
		ui.create.div(bosslist);
		ui.create.cardsAsync();
		game.finishCards();
		ui.arena.setNumber(8);
		ui.control.style.transitionProperty = "opacity";
		ui.control.classList.add("bosslist");
		setTimeout(function () {
			ui.control.style.transitionProperty = "";
		}, 1000);
		ui.window.appendChild(bosslist);
		setTimeout(function () {
			if (_status.current) {
				let left = _status.current.offsetLeft - (ui.window.offsetWidth - 180) / 2;
				if (bosslist.scrollLeft < left) {
					bosslist.scrollLeft = left;
				}
			}
			bosslist.show();
		}, 200);
		_status.bosslist = bosslist;
	}

	_applyStatOverrides(target, expand = {}) {
		if (expand.hp) {
			target.hp = expand.hp;
		}
		if (expand.maxHp) {
			target.maxHp = expand.maxHp;
		}
		if (expand.hujia) {
			target.hujia = expand.hujia;
		}
	}

	async _applyStartingCards(target, cardsMap) {
		for (const key in cardsMap) {
			const cards = cardsMap[key].map(ls => {
				const card = game.createCard2(ls[0], ls[1], ls[2], ls[3]);
				if (ls[4]) {
					card.storage = ls[4];
				}
				return card;
			});

			if (key === "h") {
				target.directgain(cards);
			} else if (key === "e") {
				for (const equip of cards) {
					await target.equip(equip);
				}
			} else if (key === "j") {
				for (const judge of cards) {
					await target.judge(judge);
				}
			} else if (key === "k" && target.addSkillCard) {
				for (const skillCard of cards) {
					await target.addSkillCard(skillCard);
				}
			}
		}
	}

	_createStageEntry(bosslist, name, stageNumber, locked) {
		const info = get.character(name);
		const player = ui.create.player(bosslist).init(name);
		if (player.hp === 0) {
			player.node.hp.style.display = "none";
		}
		player.node.hp.classList.add("text");
		player.node.hp.dataset.condition = "";
		player.node.hp.innerHTML = info.hp === Infinity ? "∞" : info.hp;
		player.setIdentity(get.rawName(player.name));
		player.node.identity.dataset.color = info[5];
		player.classList.add("bossplayer");
		player.dataset.stage = stageNumber;
		player.dataset.locked = locked ? "1" : "0";
		if (locked) {
			player.classList.add("locked");
			player.style.opacity = "0.4";
			player.style.pointerEvents = "none";
		}
		return player;
	}

	async _setupCombatant(target, info, side, position, identity) {
		target.side = side;
		target.addTempClass("start");
		target.setIdentity(identity);
		target.identity = identity;
		ui.arena.appendChild(target);
		target.dataset.position = position;
		this._applyStatOverrides(target, info.expand);
		if (info.skills?.length) {
			target.addSkills(info.skills);
		}
		await this._applyStartingCards(target, info.cards);
		for (const minion of info.minions || []) {
			game.addSideFellow(minion.seat, minion.name, side, minion.expand);
		}
		game.players.push(target);
	}

	async _offerCardExchange(event) {
		let remainingChanges = Number(get.config("change_card"));
		while (remainingChanges > 0) {
			const next = await game.me
				.chooseBool(`是否更换手牌？（剩余${get.cnNumber(remainingChanges)}次）`)
				.set("ai", () => false)
				.forResult();
			if (!next.bool) {
				break;
			}
			remainingChanges--;
			await this._replaceHandCards(event, game.me.getCards("h"));
		}
	}

	async _replaceHandCards(event, handCards) {
		const cards = [];
		const pile = event.otherPile?.[game.me.playerid];
		const otherGetCards = pile?.getCards;
		const otherDiscard = pile?.discard;
		game.addVideo("lose", game.me, [get.cardsInfo(handCards), [], [], []]);
		for (const card of handCards) {
			card.removeGaintag(true);
			if (otherDiscard) {
				otherDiscard(card);
			} else {
				card.discard(false);
			}
		}
		if (otherGetCards) {
			cards.addArray(otherGetCards(handCards.length));
		} else {
			cards.addArray(get.cards(handCards.length));
		}
		const gaintag = event.gaintag?.[game.me.playerid];
		if (gaintag) {
			const list = typeof gaintag == "function" ? gaintag(handCards.length, cards) : [[cards, gaintag]];
			for (let i = list.length - 1; i >= 0; i--) {
				game.me.directgain(list[i][0], null, list[i][1]);
			}
		} else {
			game.me.directgain(cards);
		}
		game.me._start_cards = game.me.getCards("h");
	}
	/**
	 * 舞台准备
	 */
	async prepareStage() {
		await this.showBossList();
		const bossName = _status.current.name;
		// 技能处理
		for (const i in lib.skill) {
			if (lib.skill[i].seatRelated === true) {
				lib.skill[i] = {};
				lib.translate[i + "_info"] = "此模式下不可用";
			}
		}
		// 道具选取
		game.me = ui.create.player();
		const result = await game.chooseEffect(function (target) {
			if (_status.current) {
				_status.current.classList.remove("highlight");
			}
			_status.current = target;
			game.save("current", target.name);
			target.classList.add("highlight");
			game.Check.button(_status.event);
		});
		const items = result.links;

		// 初始化Boss
		const boss = ui.create.player();
		boss.getId();
		game.boss = boss;
		boss.init(lib.boss.bossMap[bossName]);
		game.bossinfo = lib.boss.levelDesign[bossName];
		boss.side = true;
		boss.addTempClass("start");
		boss.setIdentity("zhu");
		boss.identity = "zhu";
		ui.arena.appendChild(boss);
		boss.dataset.position = 4;

		const bossInfo = lib.boss.levelDesign[bossName].bossInfo;
		this._applyStatOverrides(boss, bossInfo.expand);
		if (bossInfo.skills?.length) {
			boss.addSkills(bossInfo.skills);
		}
		await this._applyStartingCards(boss, bossInfo.cards);
		for (const minion of bossInfo.minions) {
			game.addSideFellow(minion.seat, minion.name, true, minion.expand);
		}
		game.players.push(boss);

		game.me = ui.create.player();
		const player = ui.create.player();
		player.getId();
		player.init("shiningStar_starChild").addTempClass("start");
		player.setIdentity("cai");
		player.identity = "cai";
		ui.arena.appendChild(player);
		player.side = false;
		game.players.push(player);
		player.dataset.position = 0;

		const meInfo = lib.boss.levelDesign[bossName].meInfo;
		this._applyStatOverrides(player, meInfo.expand);
		if (meInfo.skills?.length) {
			player.addSkills(meInfo.skills);
		}
		await this._applyStartingCards(player, meInfo.cards);
		for (const minion of meInfo.minions) {
			game.addSideFellow(minion.seat, minion.name, false, minion.expand);
		}
		player.addItem(items);
		setTimeout(function () {
			ui.control.classList.remove("bosslist");
		}, 500);
		_status.bosslist.delete();
	}
	/**
	 * 启动
	 * @param {GameEvent} event 主事件
	 */
	async launchEncounter(event) {
		ui.create.me();
		ui.fakeme = ui.create.div(".fakeme.avatar", ui.me);
		ui.fakeme.style.display = "none";
		const { chongzheng, init, gameDraw } = game.bossinfo.global;

		if (chongzheng > 0) {
			lib.setPopped(
				ui.create.system("重整", null, true),
				() => {
					const uiintro = ui.create.dialog("hidden");
					uiintro.add("重整");
					const table = ui.create.div(".bosschongzheng");
					let tr, td;
					let added = false;
					for (const deadUnit of game.dead) {
						if (typeof deadUnit.storage?.boss_chongzheng !== "number") {
							continue;
						}
						added = true;
						tr = ui.create.div(table);
						td = ui.create.div(tr);
						td.innerHTML = get.translation(deadUnit);
						td = ui.create.div(tr);
						td.innerHTML = deadUnit.maxHp > 0 ? `剩余${chongzheng - deadUnit.storage.boss_chongzheng}回合` : "无法重整";
					}
					if (!added) {
						uiintro.add('<div class="text center">（无重整角色）</div>');
						uiintro.add(ui.create.div(".placeholder.slim"));
					} else {
						uiintro.add(table);
					}
					return uiintro;
				},
				180
			);
		}
		if (init) {
			await init();
		}
		game.arrangePlayers();
		game.addRecentCharacter(game.me.name);
		event.trigger("gameStart");
		game.gameDraw(game.boss, gameDraw || 4);
		game.me._start_cards = game.me.getCards("h");
		await this._offerCardExchange(event);
		setTimeout(function () {
			ui.updatehl();
		}, 200);
	}
}
export default Auxiliary;
