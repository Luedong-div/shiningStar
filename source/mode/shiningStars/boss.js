import { lib, game, ui, get, _status } from "../../../../../noname.js";

const boss = {
	shiningStarsBossList: ["shiningStars_level1", "sunquan", "liubei", "dongzhuo", "lvbu", "zhaoyun", "sunjian", "sunce"],
	bossMap: {
		shiningStars_level1: "wu_zhugeliang",
	},
	levelDesign: {
		shiningStars_level1: {
			checkPerfect() {
				return game.countPlayer(i => i.name == "shiningStars_meteorite") == 2;
			},
			convo: {
				playConvoBefore: [
					["中军大帐，残灯如豆，案上《出师表》墨迹已干，诸葛亮身着鹤氅，倚坐榻上，气息微弱，手中羽扇轻垂；星辰之子立于帐前，衣袂沾尘，神色肃然"],
					["wu_zhugeliang", "星辰……你来了。"],
					["shiningStar_starChild", "听闻您……晚辈日夜兼程赶来，惟愿能为您分忧。"],
					["wu_zhugeliang", "天命有常，非人力可违。亮鞠躬尽瘁，六出祁山，终究未能北定中原，复归汉室。此身将陨，唯一牵挂者，便是这未竟的大业，与天下苍生命运。"],
					["wu_zhugeliang", "你可知，为何亮要唤你前来？"],
					["shiningStar_starChild", "晚辈愚钝，但知丞相心中所系，皆是家国百姓。晚辈虽微如尘埃，却也怀抱着安邦济世之愿，愿承丞相之志，继续前行。"],
					["wu_zhugeliang", "你非衔光而生，却能于沉潜中蓄力，于困顿中坚守，恰如你名中的“星辰”，虽初时微光，终将绽放华彩。这世间的传承，从非轻而易举的交接，而是一场淬心砺骨的考验。"],
					["诸葛亮缓缓起身，身形略显踉跄，羽扇指向帐中虚空，那里骤然浮现出一道光影结界，结界中隐约可见祁山战阵的虚影"],
					["wu_zhugeliang", "亮毕生所学，尽在八阵图之中。欲承我志，必先过我这最后一关——与亮的灵识虚影一战。胜，则汉祚之责，理想之炬，便交予你手；败，则你需再沉潜磨砺，待他日羽翼丰满，再续征途。"],
					["shiningStar_starChild", "晚辈遵命！愿向丞相讨教！"],
				],
				playConvoAfter() {
					if (boss.levelDesign.shiningStars_level1.checkPerfect()) {
						return [
							["光影结界轰然破碎，诸葛亮的灵识虚影化作点点金光，融入帐中虚空；八阵图的阵眼玄机如星河倒悬，在星辰之子眼前缓缓展开，最终凝作一卷古朴的竹简，飘至其手中"],
							["wu_zhugeliang", "好！好！好！三连叹，满含欣慰，眼中精光爆闪，竟似恢复了几分神采 此役，你不仅胜了亮的灵识，更悟透了八阵图的核心——变则通，通则久，久则利天下！"],
							["诸葛亮抬手，羽扇轻拂，星辰之子手中的竹简骤然亮起，阵图纹路如活物般流转，隐隐与天地共鸣"],
							["wu_zhugeliang", "这卷八阵图，乃亮毕生心血所铸，内含生、死、惊、伤、杜、景、休、开八门之变，可定军阵，可安城防，可护苍生。今日，亮将它正式传予你！"],
							["shiningStar_starChild", "双手紧握竹简，躬身跪地，声音铿锵有力，带着压抑不住的激动 晚辈何德何能，竟得丞相如此厚赐！此八阵图，晚辈必当奉若至宝，用之于正，护之于民，绝不辜负丞相的信任与嘱托！"],
							["wu_zhugeliang", "含笑摇头，轻咳数声，却依旧目光坚定 不必谢我。八阵图的真正价值，不在阵法本身，而在持阵之人的初心。你心怀天下，这阵法在你手中，方能发挥最大的威力。"],
							["诸葛亮缓缓抬手，指向帐外星空，语气中带着无尽的期许 亮一生六出祁山，未能北定中原，这未竟的大业，便交予你了。他日，你若能率师北上，克复旧都，便在亮的墓前，烧一份捷报，告知亮，汉室终得复兴，天下终得太平。"],
							["shiningStar_starChild", "抬头，眼中泪光闪烁，却字字千钧 晚辈遵命！此誓，天地为证，日月为鉴！晚辈定当砥砺前行，北定中原，兴复汉室，还天下一个朗朗乾坤！"],
							["诸葛亮缓缓阖目，倚回榻上，羽扇垂落于地，气息渐平，脸上却带着释然的微笑 鞠躬尽瘁，死而后已。亮，终于可以放心了……"],
							["帐外，星河璀璨，八阵图竹简在星辰之子手中微微发光，与他衣袂上的尘光相映，似在预示着一段新的传奇即将开启"],
						];
					}
					return [
						["光影结界缓缓散去，诸葛亮的灵识虚影渐渐淡去，帐中只余他本人，依旧虚弱，眼中带着几分遗憾，却也有一丝释然"],
						["wu_zhugeliang", "你……虽未完全悟透八阵图的玄机，却也展现出了足够的毅力与决心。亮虽不能将毕生所学传予你，却也对你的未来，充满了期许。"],
						["shiningStar_starChild", "躬身低头，语气中带着几分失落，却依旧坚定 晚辈惭愧，未能通过丞相的考验。但晚辈的初心，从未改变。他日，晚辈必当更加努力，沉潜磨砺，待羽翼丰满，再续丞相的遗志。"],
						["wu_zhugeliang", "含笑点头，轻咳数声 好。有志者，事竟成。亮相信，只要你坚守初心，不懈努力，终有一日，你会实现自己的理想。"],
						["诸葛亮缓缓抬手，羽扇轻扬，一道微弱的金光注入星辰之子体内，语气中带着最后的嘱托 这是亮最后的一点灵力，可助你疗伤健体。他日，若你能北上伐魏，便记得，亮的精神，永远与你同在。"],
						["shiningStar_starChild", "躬身谢恩，声音哽咽 晚辈谨记丞相教诲！"],
						["诸葛亮缓缓阖目，倚回榻上，气息渐平，脸上带着平静的微笑。"],
						["帐外，夜风卷着残叶掠过，星河漫天，似在为这位忠臣的离去，默默哀悼。"],
					];
				},
			},
			bossInfo: {
				cards: {
					h: [],
					e: [["rewrite_bagua", "spade", 1]],
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
				loopType: 1,
				chongzheng: 6,
				gameDraw(player) {
					return player == game.boss ? 8 : 4;
				},
				// 其他待添加的属性
				// checkResult(player) {},
				// loopFirst() {
				// 	return game.boss.previousSeat;
				// },
				// init() {
				// 	_status.taoni_over = get.copy(game.over);
				// },
			},
		},
	},
};

export default boss;
