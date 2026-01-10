import { lib, game, ui, get, ai, _status } from "../../../../../noname.js";
import Retur from "./js/Retur.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	viewSideHandCards: {
		charlotte: true,
		ruleSkill: true,
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				return player.side == arg.side;
			},
		},
	},
	shiningStar_retur: {
		group: ["shiningStar_retur_anchoring"],
		charlotte: true,
		ruleSkill: true,
		timestamp(record = false) {
			if (!_status.retur) {
				_status.retur = new Retur();
			}
			return _status.retur.record(record);
		},
		filter() {
			if (!_status.retur) {
				_status.retur = new Retur();
			}
			return _status.retur.record()?.length > 0;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			const timestamps = _status.retur.record();
			// 让最新时间点排在最上面，便于快速选择
			const indexed = timestamps.map((snap, idx) => ({ snap, idx })).reverse();

			const list = indexed.map(({ snap, idx }, pos) => {
				// 左侧时间线：仅显示轮次/和编号
				const labelIndex = timestamps.length - pos;
				const html = [
					`<div class="popup text textbutton retur-left-item-inner">`,
					`<table class="retur-left-item-table">`,
					"<tr>",
					`<td class="retur-left-item-index">#${labelIndex}</td>`,
					`<td class="retur-left-item-round">第 <b>${snap.round}</b> 轮</td>`,
					"</tr>",
					"</table>",
					"</div>",
				].join("");
				return [idx, html];
			});

			const { result } = await player
				.chooseButton(
					true,
					[1, 2],
					[
						"###回溯###请选择回溯的时间点",
						[
							dialog => {
								const createBlock = (parent, html) => {
									const node = document.createElement("div");
									node.classList.add("retur-block");
									if (html != null) node.innerHTML = html;
									if (parent) parent.appendChild(node);
									return node;
								};

								dialog.classList.add("fullwidth", "shiningStar-retur-ui");
								dialog.contentContainer.classList.add("retur-content-container");
								dialog.content.classList.add("retur-content");

								let leftListWrap;
								let rightPanel;

								const renderDetail = snap => {
									if (!rightPanel) return;
									if (!snap) {
										rightPanel.innerHTML = '<div class="retur-detail-empty">（无预览）</div>';
										return;
									}
									const currentName = snap.current ? get.translation(snap.current) : "未知";
									const state = snap.players?.state || {};
									const aliveIds = new Set((snap.players?.alive || []).map(p => p?.playerid).filter(Boolean));
									const entries = Object.entries(state).sort((a, b) => {
										const sa = a[1]?.seatNum ?? 999;
										const sb = b[1]?.seatNum ?? 999;
										return sa - sb;
									});

									const pile = snap.pile || {};
									const pileInfo = [
										["牌堆", pile.cardPile?.length ?? 0],
										["弃牌堆", pile.discardPile?.length ?? 0],
										["处理区", pile.ordering?.length ?? 0],
										["特殊/销毁区", pile.special?.length ?? 0],
									];

									const rows = entries
										.map(([pid, info]) => {
											const alive = aliveIds.has(pid);
											const name1 = info?.name ? get.translation(info.name) : String(pid);
											const name2 = info?.name2 ? get.translation(info.name2) : "";
											const fullName = name2 ? `${name1}/${name2}` : name1;
											const seat = info?.seatNum;
											const hp = info?.hp;
											const maxHp = info?.maxHp;
											const hujia = info?.hujia;
											const hpText = alive ? `${hp}/${maxHp}/${hujia || 0}` : "-";
											return [
												"<tr>",
												`<td class="retur-td-seat">${seat != null ? `P${seat}` : ""}</td>`,
												`<td class="retur-td-name">${fullName}</b></td>`,
												`<td class="retur-td-status">${alive ? "存活" : "阵亡"}</td>`,
												`<td class="retur-td-hp">${hpText}</td>`,
												"</tr>",
											].join("");
										})
										.join("");

									rightPanel.innerHTML = [
										`<div class="retur-detail">`,
										`<div class="retur-detail-header">`,
										`<br/>`,
										`<div class="retur-current-round">&nbsp当前回合：<span style="font-family: 'xingkai', 'xinwei', sans-serif;">${currentName}</span></div>`,
										"</div>",
										`<div class="retur-pile-info">`,
										...pileInfo.map(([k, v]) => `<span class="retur-pile-chip">${k}：<b>${v}</b></span>`),
										"</div>",
										`<div class="retur-player-table-wrap">`,
										`<table class="retur-player-table">`,
										`<thead><tr>`,
										`<th class="retur-th-seat">座位</th>`,
										`<th class="retur-th-role">角色</th>`,
										`<th class="retur-th-status">状态</th>`,
										`<th class="retur-th-hp">HP/上限/护甲</th>`,
										`</tr></thead>`,
										`<tbody>${rows}</tbody>`,
										"</table>",
										"</div>",
										`<div class="retur-cardzone"></div>`,
										"</div>",
									].join("");

									const zone = rightPanel.querySelector(".retur-cardzone");
									const meState = snap.players?.state?.[player.playerid];
									const cards = {
										h: Object.values(meState.cards.h || {}).flat(),
										e: meState.cards.e || [],
										j: meState.cards.j || [],
										s: Object.values(meState.cards.s || {}).flat(),
										x: Object.values(meState.cards.x || {}).flat(),
										k: meState.cards.k || [],
									};
									if (Object.values(cards).every(arr => arr.length === 0)) {
										const h = document.createElement("div");
										h.className = "retur-card-empty";
										h.textContent = "你的牌区均为空";
										zone.appendChild(h);
										return;
									}

									const addGroup = (label, arr) => {
										if (!arr || !arr.length) return;
										const h = document.createElement("div");
										h.className = "retur-card-group-title";
										h.textContent = label;
										zone.appendChild(h);

										const buttons = document.createElement("div");
										buttons.className = "buttons smallzoom retur-card-group-buttons";
										zone.appendChild(buttons);
										ui.create.buttons(arr, "card", buttons);
									};

									addGroup("手牌区", cards.h);
									addGroup("装备区", cards.e);
									addGroup("判定区", cards.j);
									addGroup("特殊区", cards.s);
									addGroup("扩展区", cards.x);
									addGroup("技能牌区", cards.k);
								};

								dialog.addNewRow(
									{
										item: "",
										ratio: 1,
										overflow: "scroll",
										custom: container => {
											const row = container.parentNode;
											if (row) {
												row.classList.add("retur-left-row");
											}

											container.classList.add("retur-left-list-container");

											leftListWrap = createBlock(container);
											leftListWrap.classList.add("retur-left-list");

											const fakeDialog = {
												buttons: dialog.buttons,
												add: str => {
													const wrap = createBlock(leftListWrap);
													wrap.classList.add("retur-left-item-wrapper");
													wrap.innerHTML = str;
													return wrap;
												},
											};
											ui.create.textbuttons(list, fakeDialog);

											for (const btn of leftListWrap.querySelectorAll(".textbutton")) {
												btn.addEventListener(
													"click",
													function () {
														renderDetail(timestamps[this.link]);
													},
													true
												);
												btn.addEventListener(
													"mouseover",
													function () {
														if (ui.selected?.buttons?.length > 0) return;
														renderDetail(timestamps[this.link]);
													},
													true
												);
											}
										},
									},
									{
										item: "",
										ratio: 2.5,
										overflow: "scroll",
										itemContainerCss: {
											right: "-20px",
										},
										custom: container => {
											container.classList.add("retur-right-panel-container");

											rightPanel = createBlock(container);
											rightPanel.classList.add("retur-right-panel");
											renderDetail(indexed[0]?.snap);
										},
									}
								);
							},
							"handle",
						],
					]
				)
				.set("filterButton", () => {
					if (ui.selected?.buttons?.length > 0) return false;
					return true;
				})
				.set("ai", button => (button.link === timestamps.length - 1 ? 2 : 0));

			if (!result?.bool || !result.links?.length) return;

			const chosenIndex = result.links[0];
			const chosenSnap = timestamps[chosenIndex];
			const current = chosenSnap.current;
			await _status.retur.back(chosenSnap);
			if (player.hasItem && player.hasItem("shiningStars_eternalStars")) {
				_status.retur.toRecord(player);
			} else {
				_status.retur.toRecord(current);
			}
		},
		trigger: { player: "dieBegin" },
		subSkill: {
			anchoring: {
				trigger: { global: ["gameDrawAfter", "phaseBegin"] },
				ruleSkill: true,
				charlotte: true,
				firstDo: true,
				async cost(event, trigger, player) {
					if (trigger.name == "gameDraw") {
						event.result = { bool: true };
					} else if (trigger.getParent("phaseLoop").retur) {
						delete trigger.getParent("phaseLoop").retur;
						event.result = { bool: false };
					} else {
						event.result = await player
							.chooseBool(`###回溯###是否记录一个时间点？`)
							.set("ai", () => true)
							.forResult();
					}
				},
				content() {
					lib.skill.shiningStar_retur.timestamp(true);
				},
			},
		},
	},

	// 第一关
	shiningStars_level1_show: {
		charlotte: true,
	},
	shiningStars_meteorite_skill: {
		trigger: {
			player: "phaseBegin",
		},
		forced: true,
		async content(event, trigger, player) {
			const targets = game.filterPlayer(i => [i.name, i.name2].includes("wu_zhugeliang"));
			for (const target of targets) {
				await target.damage(1, "fire");
			}
			await game.asyncDraw(game.filterPlayer().sortBySeat(player), 1);
		},
	},
};

export default skills;
