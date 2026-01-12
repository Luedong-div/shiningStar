import { lib, game, ui, get, _status } from "../../../../../noname.js";
import BoostStore from "./class/BoostStore.js";

export default {
	reserveDead: true,
	async pop_up_prompt(message, where) {
		const div = document.createElement("div");
		div.textContent = message;
		div.style.opacity = "1";
		div.style.transition = "opacity 1s ease-out, transform 1s ease-out";
		div.style.position = "fixed";
		div.style.display = "flex";
		div.style.justifyContent = "center";
		div.style.alignItems = "center";
		div.style.textAlign = "center";
		div.style.flexDirection = "column";
		let top = "30%",
			left = "50%";

		if (where) {
			const positions = where.split("|");
			top = `${parseFloat(positions[0]) * 100}%`;
			if (positions.length > 1) left = `${parseFloat(positions[1]) * 100}%`;
		}

		div.style.top = top;
		div.style.left = left;
		div.style.transform = "translate(-50%, -50%) scale(0.1)";
		div.style.backgroundColor = "transparent";
		div.style.padding = "0";
		div.style.border = "none";
		div.style.zIndex = "1000";
		div.style.fontSize = "1.5vw";

		document.body.appendChild(div);
		await new Promise(resolve => setTimeout(resolve, 30));
		div.style.transform = "translate(-50%, -50%) scale(1)";
		const cleanedMessage = message.replace(/[ ,;.!]/g, "");
		const fadeOutStartTime = cleanedMessage.length * 150;
		await new Promise(resolve => setTimeout(resolve, fadeOutStartTime));
		div.style.opacity = "0";
		await new Promise(resolve => setTimeout(resolve, 1000));

		document.body.removeChild(div);
	},

	async chooseEffect(func) {
		const data = await BoostStore.read();
		const boostItem = data.boostItem || [];
		const next = game.me
			.chooseButton(
				[
					"参战角色固定为：群星星辰之子",
					[["shiningStar_starChild"], "character"],
					[
						dialog => {
							dialog.classList.add("fixed");
							ui.window.appendChild(dialog);
							dialog.classList.add("bosscharacter");
							dialog.classList.add("modeshortcutpause");
							dialog.classList.add("withbg");
							dialog.noopen = true;
							dialog.buttons.forEach(button => {
								if (button.link == "shiningStar_starChild") button.style.setProperty("opacity", "1", "important");
							});
						},
						"handle",
					],
					[
						dialog => {
							dialog.add("请选择携带的道具/增益（至多三个）", "forcebutton");
							const caption = ui.create.div(".searcher.caption");
							const resultWrap = ui.create.div(".searcher.results");
							let lastTextButtons = [];
							let lastTextWrappers = [];
							const input = document.createElement("input");
							input.classList.add("qxx-searcher__input");
							input.type = "text";
							input.placeholder = "请输入道具/增益的信息";
							input.spellcheck = false;
							let find = ui.create.button(["find", "确定"], "tdnodes");
							find.classList.add("qxx-searcher__btn");
							let clear = ui.create.button(["clear", "清空"], "tdnodes");
							clear.classList.add("qxx-searcher__btn");

							const clearResults = () => {
								if (lastTextButtons?.length) {
									dialog.buttons = dialog.buttons.filter(b => !lastTextButtons.includes(b));
									lastTextButtons.length = 0;
								}
								if (lastTextWrappers?.length) {
									for (const node of lastTextWrappers) {
										try {
											node.remove();
										} catch (e) {}
									}
									lastTextWrappers.length = 0;
								}
								resultWrap.innerHTML = "";
							};

							const setResultMessage = message => {
								resultWrap.textContent = message;
							};

							const renderResults = (ids, message) => {
								clearResults();
								setResultMessage(message);
								if (!ids || !ids.length) {
									return;
								}

								const shown = ids.slice(0, 30);
								const mapped = shown.map(id => [id, `【${get.translation(id)}】${get.translation(id + "_info")}`]);

								const beforeCount = dialog.content.childNodes.length;
								dialog.add([mapped, "textbutton"]);
								const added = Array.from(dialog.content.childNodes).slice(beforeCount);
								lastTextWrappers = added;
								lastTextButtons = [];
								for (const wrap of added) {
									if (wrap && wrap.firstChild) {
										lastTextButtons.push(wrap.firstChild);
									}
								}
								if (dialog.buttons.length > 1) {
									for (let index = 1; index < dialog.buttons.length; index++) {
										dialog.buttons[index].classList.add("selectable");
									}
								}
							};

							const showAllBoostItems = () => renderResults(boostItem, "你拥有的所有道具/增益");
							const showSearchResults = ids => renderResults(ids, "搜索结果如下");
							const showSearchFail = () => renderResults(boostItem, "搜索失败，显示所有道具/增益");

							const updateFind = () => {
								const q = input.value.trim();
								if (!q) {
									showAllBoostItems();
									return;
								}
								const qLower = q.toLowerCase();
								const exact = [];
								const hit = [];
								for (const key of boostItem) {
									if (!lib.translate[key + "_info"]) continue;
									const name = String(lib.translate[key] || "");
									const intro = String(lib.translate[key + "_info"] || "");
									const info = String(key).toLowerCase() + String(intro).toLowerCase();
									if (key === q || name === q) {
										exact.push(key);
										continue;
									}
									if (info.includes(qLower) || name.includes(q)) {
										hit.push(key);
									}
								}
								const matches = exact.concat(hit);
								if (matches.length) {
									showSearchResults(matches);
								} else {
									showSearchFail();
								}
							};
							find.addEventListener("click", updateFind);
							clear.addEventListener("click", () => {
								input.value = "";
								showAllBoostItems();
							});
							input.onkeydown = function (e) {
								e.stopPropagation();
								if (e.code == "Enter") {
									updateFind();
								}
							};
							input.onmousedown = function (e) {
								e.stopPropagation();
							};
							caption.append(input, find, clear);
							dialog.content.appendChild(caption);
							dialog.content.appendChild(resultWrap);
							showAllBoostItems();
						},
						"handle",
					],
				],
				true
			)
			.set("onfree", true);
		next._triggered = null;
		next.custom.replace.target = func;
		next.selectButton = [1, 3];
		next.filterButton = function (button) {
			if (button.link == "shiningStar_starChild") return false;
			if (ui.selected.buttons.length) return false;
			return true;
		};
		next.forResult();
		await next;
		const result = next.result;
		return {
			bool: result.bool,
			links: result.links,
		};
	},
	/**
	 * @param {Array} lines - 剧场对话数组，每个元素包含角色名和对话内容
	 * @returns {Promise<void>} 在对话结束或跳过时 resolve
	 */
	async playConvo(lines) {
		return new Promise(resolve => {
			let num = 0;
			let resizeListener;
			let finished = false;

			const finish = () => {
				if (finished) return;
				finished = true;
				window.removeEventListener("resize", resizeListener);
				game.resume();
				resolve();
			};

			const step1 = () => {
				const entry = lines[num];
				const isNarration = entry.length === 1;
				const dialogText = entry[entry.length - 1];
				const dialog = ui.create.dialog();
				dialog.addText(`<span style="font-size:16px;">${dialogText}</span>`, false);
				dialog.classList.add("shiningStar-convo", "scroll");
				if (isNarration) dialog.classList.add("shiningStar-convo--narration");
				let player;
				if (!isNarration) {
					player = ui.create.div(".avatar", dialog).setBackground(entry[0], "character");
					player.style.position = "absolute";
					player.style.height = "168px";
				}

				dialog.style.height = "191px";
				dialog.style.textAlign = isNarration ? "center" : "left";
				dialog.style.position = "absolute";
				dialog.style.transition = "transform 0.28s ease";

				const avatarOffset = 0;
				const updateDialogPosition = () => {
					const dialogWidth = dialog.offsetWidth;
					const windowWidth = window.innerWidth;
					const centerPosition = (windowWidth - dialogWidth) / 2;
					dialog.style.left = `${centerPosition + avatarOffset}px`;
				};

				updateDialogPosition();

				resizeListener = () => {
					updateDialogPosition();
				};

				window.addEventListener("resize", resizeListener);

				ui.auto.hide();
				dialog.open();

				const closeDialog = () => {
					ui.dialog.close();
					while (ui.controls.length) ui.controls[0].close();
					window.removeEventListener("resize", resizeListener);
				};

				ui.create.control("继续", () => {
					closeDialog();
					num++;
					if (num >= lines.length) {
						finish();
					} else {
						step1();
					}
				});

				ui.create.control("跳过", () => {
					closeDialog();
					finish();
				});
			};
			game.pause();
			step1();
		});
	},
	/**
	 * 添加额外角色
	 * @param {Number} position 座位
	 * @param {String} name 角色id
	 * @param {Boolean} side 是否为Boss一方
	 * @param {Object} expand 额外属性 {hp, maxHp, hujia, extraDraw}
	 * @returns {void}
	 */
	addSideFellow(position, name, side = true, expand = { hp: 0, maxHp: 0, hujia: 0, extraDraw: 0 }) {
		let text = side ? "zhong" : "cai";
		const fellow = game.addFellow(position, name, "zoominanim");
		if (expand.extraDraw) fellow.directgain(get.cards(expand.extraDraw));
		fellow.side = side;
		fellow.identity = text;
		fellow.setIdentity(text);
		if (expand.hp) {
			fellow.hp = expand.hp;
		}
		if (expand.maxHp) {
			fellow.maxHp = expand.maxHp;
		}
		if (expand.hujia) {
			fellow.hujia = expand.hujia;
		}
		game.addVideo("setIdentity", fellow, text);
	},

	// 后续实现功能
	// changeBoss(name, player) {
	// 	if (!player) {
	// 		if (game.additionaldead) {
	// 			game.additionaldead.push(game.boss);
	// 		} else {
	// 			game.additionaldead = [game.boss];
	// 		}
	// 		player = game.boss;
	// 		delete game.boss;
	// 	}

	// 	player.delete();
	// 	game.players.remove(player);
	// 	game.dead.remove(player);
	// 	var boss = ui.create.player();
	// 	boss.getId();
	// 	boss.init(name);
	// 	boss.side = true;
	// 	game.addVideo("bossSwap", player, (game.boss ? "_" : "") + boss.name);
	// 	boss.dataset.position = player.dataset.position;
	// 	if (game.me == player) {
	// 		game.swapControl(boss);
	// 	}
	// 	game.players.push(boss.addTempClass("zoominanim"));
	// 	game.arrangePlayers();
	// 	if (!game.boss) {
	// 		game.boss = boss;
	// 		boss.setIdentity("zhu");
	// 		boss.identity = "zhu";
	// 	} else {
	// 		boss.setIdentity("zhong");
	// 		boss.identity = "zhong";
	// 	}
	// 	ui.arena.appendChild(boss);
	// 	boss.directgain(get.cards(4));
	// },
	/**
	 * 胜负判定
	 */
	async checkResult() {
		game.over(!game.boss.isAlive());
		const currentData = await BoostStore.read();
		currentData.currentLevel = game.currentLevel + 1;
		await BoostStore.write(currentData);
	},
	bossPhaseLoop() {
		const next = game.createEvent("phaseLoop");

		if (game.bossinfo.loopFirst) {
			next.player = game.bossinfo.loopFirst();
		} else {
			next.player = game.boss;
		}

		_status.looped = true;
		next.setContent([
			async (event, trigger, player) => {
				if (player.chongzheng) {
					player.chongzheng = false;
				} else if (player.isDead()) {
					//增加重整计数，以及复活角色
					if (player.hp < 0) {
						player.hp = 0;
					}
					player.storage.boss_chongzheng++;
					if (player.maxHp > 0 && game.bossinfo.chongzheng) {
						if (player.hp < player.maxHp) {
							player.hp++;
						} else if (player.countCards("h") < 4) {
							var card = get.cards()[0];
							var sort = lib.config.sort_card(card);
							var position = sort > 0 ? player.node.handcards1 : player.node.handcards2;
							card.fix();
							card.addTempClass("start");
							position.insertBefore(card, position.firstChild);
						}
						player.update();
						if (player.storage.boss_chongzheng >= game.bossinfo.chongzheng) {
							player.revive(player.hp);
						}
					}
					if (game.bossinfo.loopType == 2) {
						game.boss.chongzheng = true;
					}
				} else {
					//执行回合
					if (player.identity == "zhu" && game.boss != player) {
						player = game.boss;
					}
					const phase = event.player.phase();
					event.next.remove(phase);
					let isRoundEnd = false;
					if (lib.onround.every(i => i(phase, event.player))) {
						isRoundEnd = _status.roundSkipped;
						if (_status.isRoundFilter) {
							isRoundEnd = _status.isRoundFilter(phase, event.player);
						} else if (_status.seatNumSettled) {
							const seatNum = event.player.getSeatNum();
							if (seatNum != 0) {
								if (get.itemtype(_status.lastPhasedPlayer) != "player" || seatNum < _status.lastPhasedPlayer.getSeatNum()) {
									isRoundEnd = true;
								}
							}
						} else if (event.player == _status.roundStart) {
							isRoundEnd = true;
						}
						if (isRoundEnd && _status.globalHistory.some(i => i.isRound)) {
							game.log();
							await event.trigger("roundEnd");
						}
					}
					event.next.push(phase);
					await phase;
				}
				//触发phaseOver时机
				await event.trigger("phaseOver");
			},
			async (event, trigger, player) => {
				if (game.bossinfo.loopType == 2) {
					//最强神话那种回合执行顺序，boss一个回合，玩家再按顺序执行一个回合
					_status.roundStart = true;
					if (event.player == game.boss) {
						if (!_status.last || _status.last.nextSeat == game.boss) {
							event.player = game.boss.nextSeat;
							//如果当前角色为boss且下一个角色从头开始才触发每轮结束时的时机
							delete _status.roundStart;
						} else {
							event.player = _status.last.nextSeat;
						}
					} else {
						_status.last = player;
						event.player = game.boss;
					}
				} else {
					//这个是正常的执行顺序，就按座位顺序算
					event.player = event.player.nextSeat;
				}
				event.goto(0);
			},
		]);
	},
};
