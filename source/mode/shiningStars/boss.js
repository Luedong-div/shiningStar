import { lib, game, ui, get, _status } from "../../../../../noname.js";
import convo from "./convo.js";

// 先全部同名，为了方便测试，后续再改
const bossList = ["wu_zhugeliang", "wu_zhugeliang", "wu_zhugeliang", "wu_zhugeliang", "wu_zhugeliang", "wu_zhugeliang"];

/** @type {import('./boss').default} */
const boss = {
	bossMap: {},
	levelDesign: {
		shiningStars_level1: {
			// 第一关：五丈原夜话
			convo: {},
			bossInfo: {
				cards: {
					h: [],
					e: [],
					j: [],
					k: [],
				},
				skills: ["shiningStars_stoneSentinelMaze"],
				expand: {
					extraDraw: null,
					hp: null,
					maxHp: null,
					hujia: null,
				},
				minions: [],
			},
			meInfo: {
				cards: {
					h: [],
					e: [],
					j: [],
					k: [],
				},
				skills: [],
				expand: {
					extraDraw: null,
					hp: null,
					maxHp: null,
					hujia: null,
				},
				minions: [
					{
						seat: 1,
						name: "shiningStars_meteorite",
						cards: {
							h: [],
							e: [],
							j: [],
							k: [],
						},
						expand: {
							extraDraw: null,
							hp: null,
							maxHp: null,
							hujia: null,
						},
						skills: [],
					},
					{
						seat: 7,
						name: "shiningStars_meteorite",
						cards: {
							h: [],
							e: [],
							j: [],
							k: [],
						},
						skills: [],
						expand: {
							extraDraw: null,
							hp: null,
							maxHp: null,
							hujia: null,
						},
					},
				],
			},
			items: [
				{
					name: "shiningStars_stoneSentinelMaze",
					possibility: 0.5,
				},
			],
			global: {
				// loopFirst: 0, // 首个出手角色的座位 Number 0-7，默认是boss座位（即4）
				loopType: 1,
				chongzheng: 6,
				gameDraw(player) {
					return player == game.boss ? 8 : 4;
				},
				init() {},
				checkPerfect() {
					return game.countPlayer(i => i.name == "shiningStars_meteorite") == 2;
				},
			},
		},
		// 目前只创建对话
		shiningStars_level2: {
			convo: {},
		},
	},
};
for (const [index, name] of bossList.entries()) {
	boss.bossMap[`shiningStars_level${index + 1}`] = name;
	if (convo[`shiningStars_level${index + 1}`]) boss.levelDesign[`shiningStars_level${index + 1}`].convo = convo[`shiningStars_level${index + 1}`];
}

export default boss;
