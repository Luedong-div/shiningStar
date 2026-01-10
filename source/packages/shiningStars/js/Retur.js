import { lib, game, ui, get, ai, _status } from "../../../../../../noname.js";

class Retur {
	// 控制全局基础元素，用于差异化收集以及一些常量定义
	basicElement = {
		global: Object.keys(global),
		game: Object.keys(game),
		_status: Object.keys(_status),
		RETUR_TIMELINE_KEY: "shiningStar_retur_timeline",
		RETUR_MAX_SNAPSHOTS: 10,
	};

	/**
	 * 深拷贝：把数组/普通对象从“引用”变为“值快照”。
	 * - card/player/DOM 节点等运行时对象保持引用（否则会破坏引擎对象与 DOM 关系）
	 * - 支持循环引用（WeakMap）
	 */
	clone(value, _seen) {
		if (value == null) return value;
		const t = typeof value;
		if (t !== "object") return value;

		// 保留引擎对象/DOM 引用
		try {
			const item = get.itemtype?.(value);
			if (item === "card" || item === "player") return value;
		} catch (e) {
			// ignore
		}
		try {
			if (typeof Node !== "undefined" && value instanceof Node) return value;
		} catch (e) {
			// ignore
		}

		_seen ??= new WeakMap();
		if (_seen.has(value)) return _seen.get(value);

		if (Array.isArray(value)) {
			const out = [];
			_seen.set(value, out);
			for (const v of value) out.push(this.clone(v, _seen));
			return out;
		}
		if (value instanceof Date) {
			return new Date(value.getTime());
		}
		if (value instanceof Map) {
			const out = new Map();
			_seen.set(value, out);
			for (const [k, v] of value.entries()) {
				out.set(this.clone(k, _seen), this.clone(v, _seen));
			}
			return out;
		}
		if (value instanceof Set) {
			const out = new Set();
			_seen.set(value, out);
			for (const v of value.values()) out.add(this.clone(v, _seen));
			return out;
		}

		const proto = Object.getPrototypeOf(value);
		// 只深拷贝“普通对象”（含 null 原型对象），其余复杂实例保持引用
		if (proto !== Object.prototype && proto !== null) {
			return value;
		}
		const out = proto === null ? Object.create(null) : {};
		_seen.set(value, out);
		for (const key of Object.keys(value)) {
			out[key] = this.clone(value[key], _seen);
		}
		return out;
	}

	collectPileCards(node) {
		if (!node || !node.childNodes) return [];
		return Array.from(node.childNodes).filter(c => get.itemtype(c) === "card");
	}

	collectPile() {
		const pile = {
			inpile: this.clone(lib.inpile),
			inpile_nature: this.clone(lib.inpile_nature),
			cardPile: this.collectPileCards(ui.cardPile),
			discardPile: this.collectPileCards(ui.discardPile),
			special: this.collectPileCards(ui.special),
			ordering: this.collectPileCards(ui.ordering),
			commonArea: {},
			originalCommonArea: lib.commonArea,
		};
		for (const [key, value] of lib.commonArea) {
			pile.commonArea[value.areaStatusName] = this.clone(_status[value.areaStatusName]);
		}
		return pile;
	}

	collectAllCard() {
		const pile = [...this.collectPileCards(ui.cardPile), ...this.collectPileCards(ui.discardPile), ...this.collectPileCards(ui.special), ...this.collectPileCards(ui.ordering)];
		for (const target of game.filterPlayer(true, [], true)) {
			pile.push(...target.getCards("hejksx"));
		}
		return pile;
	}

	collectGlobal() {
		const globalDif = {};
		const globalKeyDif = Object.keys(global).filter(k => !this.basicElement.global.includes(k));
		for (const key of globalKeyDif) {
			globalDif[key] = this.clone(global[key]);
		}
		globalDif.globalSkill = this.clone(get.skillState?.()?.global || []);
		return globalDif;
	}

	collectGame() {
		const gameDif = {};
		const gameKeyDif = Object.keys(game).filter(k => !this.basicElement.game.includes(k));
		for (const key of gameKeyDif) {
			gameDif[key] = this.clone(game[key]);
		}
		return gameDif;
	}

	collect_status() {
		const statusDif = {};
		const statusKeyDif = Object.keys(_status).filter(k => k != "retur" && k != this.basicElement.RETUR_TIMELINE_KEY && !this.basicElement._status.includes(k));
		for (const key of statusKeyDif) {
			statusDif[key] = this.clone(_status[key]);
		}
		statusDif.globalHistory = this.clone(_status.globalHistory);
		return statusDif;
	}

	collectPlayer() {
		const targets = game.filterPlayer(true, [], true).concat(game.dead || []);
		const maps = {
			alive: [],
			dead: [],
			state: {},
		};
		for (const target of targets) {
			if (target.isDead()) {
				maps.dead.push(target);
			} else {
				maps.alive.push(target);
			}
			maps.state[target.playerid] = {
				name: target.name,
				name2: target.name2,
				hp: target.hp,
				maxHp: target.maxHp,
				hujia: target.hujia,
				sex: target.sex,
				side: target.side,
				seatNum: target.seatNum || Number(target.dataset.position) + 1,
				identity: target.identity,
				identityShown: target.identityShown,
				lili: target.lili,

				turnedover: target.isTurnedOver(),
				linked: target.isLinked(),
				isOut: target.isOut(),

				disabledSlots: this.clone(target.disabledSlots),
				expandedSlots: this.clone(target.expandedSlots),
				storage: this.clone(target.storage),

				tempSkills: this.clone(target.tempSkills),
				additionalSkills: this.clone(target.additionalSkills),
				skills: this.clone(target.skills),
				awakenedSkills: this.clone(target.awakenedSkills),
				stat: this.clone(target.stat),

				cards: {
					e: target.getCards("e"),
					// h: target.getCards("h"),
					j: target.getCards("j"),
					k: target.getCards("k"),
					// s: target.getCards("s"),
					// x: target.getCards("x"),
				},
				history: this.clone(target.actionHistory),
			};
			if (true) {
				const hCards = target.getCards("h");
				maps.state[target.playerid].cards.h ??= {
					notag: hCards.filter(c => !c.gaintag || c.gaintag.length == 0),
				};
				const allTags = hCards.map(i => i.gaintag || []).flat();
				for (const tag of allTags) {
					maps.state[target.playerid].cards.h[tag] = hCards.filter(c => c.gaintag?.includes(tag));
				}
			}
			if (true) {
				const sCards = target.getCards("s");
				maps.state[target.playerid].cards.s ??= {};

				const allTags = sCards.map(i => i.gaintag || []).flat();
				for (const tag of allTags) {
					maps.state[target.playerid].cards.s[tag] = sCards.filter(c => c.gaintag?.includes(tag));
				}
			}
			if (true) {
				const xCards = target.getCards("x");
				maps.state[target.playerid].cards.x ??= {};
				const allTags = xCards.map(i => i.gaintag || []).flat();
				for (const tag of allTags) {
					maps.state[target.playerid].cards.x[tag] = xCards.filter(c => c.gaintag?.includes(tag));
				}
			}
		}
		return maps;
	}

	toRecord(who) {
		if (!who) return;
		if (_status.event.name != "phaseLoop") {
			let evt = _status.event.getParent("phaseLoop", true);
			if (evt) {
				let evtx = _status.event;
				while (evtx != evt) {
					evtx.finish();
					evtx.untrigger(true);
					evtx = evtx.getParent();
				}
				evtx.player = who;
				evtx.step = 0;
				evtx.retur = true;
			}
		}
	}

	/**
	 * 记录或获取时间线快照
	 * @param {Boolean} record 是否记录当前时间点快照
	 * @returns {Array} 时间线快照数组
	 */
	record(record = false) {
		_status[this.basicElement.RETUR_TIMELINE_KEY] ??= [];
		if (record) {
			const snap = {
				t: Date.now(),
				current: _status.event.getParent("phaseLoop").player || game.findPlayer(i => i.dataset.position == 0),
				round: game.roundNumber,
				global: this.collectGlobal(),
				game: this.collectGame(),
				_status: this.collect_status(),
				pile: this.collectPile(),
				players: this.collectPlayer(),
			};
			_status[this.basicElement.RETUR_TIMELINE_KEY].push(snap);
			if (_status[this.basicElement.RETUR_TIMELINE_KEY].length > this.basicElement.RETUR_MAX_SNAPSHOTS) {
				_status[this.basicElement.RETUR_TIMELINE_KEY].shift();
			}
		}
		return _status[this.basicElement.RETUR_TIMELINE_KEY];
	}

	/**
	 * 回溯到指定时间点
	 * @param {Object} timestamp - 时间点快照对象
	 * @returns {Promise<void>}
	 */
	async back(timestamp) {
		if (!timestamp) {
			timestamp = this.record().at(-1);
		}
		game.roundNumber = timestamp.round;
		// global
		if (true) {
			const currentSkills = get.skillState?.()?.global || [];
			const targetSkills = timestamp.global["globalSkill"] || [];
			const removeSkills = currentSkills.filter(s => !targetSkills.includes(s));
			const addSkills = targetSkills.filter(s => !currentSkills.includes(s));
			game.removeGlobalSkill(removeSkills);
			game.addGlobalSkill(addSkills);
		}
		if (true) {
			const timestampKeys = Object.keys(timestamp.global).remove("globalSkill");
			const globalRemove = Object.keys(global).filter(k => !this.basicElement.global.includes(k) && !timestampKeys.includes(k));
			for (const key of globalRemove) {
				delete global[key];
			}
			for (const key of timestampKeys) {
				global[key] = this.clone(timestamp.global[key]);
			}
		}

		// game
		if (true) {
			const timestampKeys = Object.keys(timestamp.game);
			const gameRemove = Object.keys(game).filter(k => !this.basicElement.game.includes(k) && !timestampKeys.includes(k));
			for (const key of gameRemove) {
				delete game[key];
			}
			for (const key of timestampKeys) {
				game[key] = this.clone(timestamp.game[key]);
			}
		}

		// players
		const players = timestamp.players;
		const nowPlayers = game.filterPlayer(true, [], true).concat(game.dead || []);
		if (true) {
			for (const target of nowPlayers) {
				if (target.isAlive() && !players.alive.includes(target)) {
					await target.die();
				}
				if (target.isDead() && players.alive.includes(target)) {
					await target.reviveEvent(1);
				}
			}
		}
		if (true) {
			const state = players.state;
			// 先清空所有牌区
			for (const target of nowPlayers) {
				if (target.countCards("ehjksx")) await game.cardsGotoOrdering(target.getCards("ehjksx"));
			}
			for (const target of nowPlayers) {
				const info = state[target.playerid];
				if (!info) continue;
				await target.changeCharacter([info.name, info.name2], false);

				Object.assign(target, {
					name: info.name,
					name2: info.name2,
					hp: info.hp,
					maxHp: info.maxHp,
					hujia: info.hujia,
					sex: info.sex,
					side: info.side,
					seatNum: info.seatNum,
					identity: info.identity,
					identityShown: info.identityShown,
					lili: info.lili,
					disabledSlots: this.clone(info.disabledSlots),
					expandedSlots: this.clone(info.expandedSlots),
					storage: this.clone(info.storage),
				});
				if (!target.isTurnedOver() && info.turnedover) {
					await target.turnOver();
				}
				if (!target.isLinked() && info.linked) {
					await target.link();
				}
				if (!target.isOut() && info.isOut) {
					target.out();
				}
				if (true) {
					const nowTempSkills = Object.keys(target.tempSkills);
					const targetTempSkills = Object.keys(info.tempSkills);
					const removeTempSkills = nowTempSkills.filter(s => !targetTempSkills.includes(s));
					const addTempSkills = targetTempSkills.filter(s => !nowTempSkills.includes(s));
					target.removeSkill(removeTempSkills);
					for (const sk of addTempSkills) {
						target.addTempSkill(sk, this.clone(info.tempSkills[sk]));
					}
					target.additionalSkills = this.clone(info.additionalSkills);
					const nowAwakenedSkills = target.awakenedSkills;
					const targetAwakenedSkills = info.awakenedSkills;
					const removeAwakenedSkills = nowAwakenedSkills.filter(s => !targetAwakenedSkills.includes(s));
					const addAwakenedSkills = targetAwakenedSkills.filter(s => !nowAwakenedSkills.includes(s));
					for (const sk of removeAwakenedSkills) {
						target.restoreSkill(sk);
					}
					for (const sk of addAwakenedSkills) {
						target.awakenSkill(sk);
					}
					const nowTargetSkills = target.skills;
					const targetSkills = info.skills;
					const removeSkills = nowTargetSkills.filter(s => !targetSkills.includes(s));
					const addSkills = targetSkills.filter(s => !nowTargetSkills.includes(s));
					target.removeSkill(removeSkills);
					target.addSkill(addSkills);
					target.stat = this.clone(info.stat);
				}

				if (true) {
					const hCards = info.cards.h;
					for (const [key, cards] of Object.entries(hCards)) {
						if (key == "notag") {
							const next = target.gain(cards);
							next._triggered = null;
							await next;
						} else {
							const next = target.gain(cards);
							next.gaintag.add(key);
							next._triggered = null;
							await next;
						}
					}
				}
				for (const e of info.cards.e) {
					const next = target.equip(e);
					next._triggered = null;
					await next;
				}
				for (const j of info.cards.j) {
					const next = target.addJudge(j, [j]);
					next._triggered = null;
					await next;
				}
				for (const k of info.cards.k) {
					const next = target.addSkillCard(k);
					next._triggered = null;
					await next;
				}
				if (true) {
					const sCards = info.cards.s;
					for (const [key, cards] of Object.entries(sCards)) {
						const next = target.loseToSpecial(cards, key);
						next._triggered = null;
						await next;
					}
				}
				if (true) {
					const xCards = info.cards.x;
					for (const [key, cards] of Object.entries(xCards)) {
						const next = target.addToExpansion(cards);
						next.gaintag.add(key);
						next._triggered = null;
						await next;
					}
				}

				target.actionHistory = this.clone(info.history);
				target.update();
				ui.updatehl();
			}
		}

		// pile-必须靠后处理
		const pile = timestamp.pile;
		if (true) {
			for (const name of ["cardPile", "discardPile", "special", "ordering"]) {
				ui[name].innerHTML = "";
				pile[name].forEach(node => {
					if (node instanceof Node) {
						ui[name].appendChild(node);
					}
				});
			}
		}
		lib.inpile = pile.inpile;
		lib.inpile_nature = pile.inpile_nature;
		lib.commonArea = pile.originalCommonArea;
		for (const key in pile.commonArea) {
			_status[key] = pile.commonArea[key];
		}

		if (true) {
			_status.globalHistory = this.clone(timestamp._status.globalHistory);
		}
		if (true) {
			const timestampKeys = Object.keys(timestamp._status).remove("globalHistory");
			const statusRemove = Object.keys(_status).filter(k => k != "retur" && k != this.basicElement.RETUR_TIMELINE_KEY && !this.basicElement._status.includes(k) && !timestampKeys.includes(k));
			for (const kye of statusRemove) {
				delete _status[kye];
			}
			for (const key of timestampKeys) {
				_status[key] = this.clone(timestamp._status[key]);
			}
		}
	}
}

export default Retur;
