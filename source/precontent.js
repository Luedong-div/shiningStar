import { lib, game, ui, get, _status } from "../../../noname.js";
import shiningStars from "./packages/shiningStars/index.js";
import shiningStarsMode from "./mode/shiningStars/main.js";

function setupQxxRandomNamePrefixStars() {
    if (globalThis.__qxxNamePrefixStarsSetup) return;
    globalThis.__qxxNamePrefixStarsSetup = true;

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

    const DUST_TICK_MS = 32000;
    // 贴花星点层
    const DECAL_SMALL_TICK_MS = 24000;
    const DECAL_BIG_TICK_MS = 36000;
    const DECAL_FADE_MS = 1600;
    const intervals = new WeakMap();

    const rand = (min, max) => min + Math.random() * (max - min);
    const randInt = (min, max) => Math.floor(rand(min, max + 1));
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const DECAL_X_MIN = 10;
    const DECAL_X_MAX = 90;
    const DECAL_Y_MIN = 8;
    const DECAL_Y_MAX = 92;
    const DECAL_SMALL_BASE_MIN_DIST = 16;
    const DECAL_BIG_BASE_MIN_DIST = 28;
    const DECAL_SMALL_COUNT = 9; // 6 * 1.5
    const DECAL_BIG_COUNT = 6; // 4 * 1.5

    function randomizeDust(layer, changes = 1, prefix = "--qxx-da") {
        if (!(layer instanceof Element)) return;
        for (let i = 0; i < changes; i++) {
            const k = randInt(1, 4);
            layer.style.setProperty(`${prefix}${k}x`, rand(10, 90).toFixed(1) + "%");
            layer.style.setProperty(`${prefix}${k}y`, rand(8, 92).toFixed(1) + "%");
        }
    }

    function setDecalPoint(container, prefix, k, x, y) {
        container.style.setProperty(`${prefix}${k}x`, clamp(x, DECAL_X_MIN, DECAL_X_MAX).toFixed(1) + "%");
        container.style.setProperty(`${prefix}${k}y`, clamp(y, DECAL_Y_MIN, DECAL_Y_MAX).toFixed(1) + "%");
    }

    function dist(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.hypot(dx, dy);
    }

    function minDistToSet(p, set, excludeIndex = -1) {
        let best = Infinity;
        for (let i = 0; i < set.length; i++) {
            if (i === excludeIndex) continue;
            const d = dist(p, set[i]);
            if (d < best) best = d;
        }
        return best === Infinity ? 9999 : best;
    }

    function proposeDispersedPoint(set, excludeIndex, minDistTarget, samples = 24) {
        // 采样若干候选点，选“离最近邻更远”的那个；并尽量满足 minDistTarget。
        let bestP = null;
        let bestScore = -1;
        for (let i = 0; i < samples; i++) {
            const p = {
                x: rand(DECAL_X_MIN, DECAL_X_MAX),
                y: rand(DECAL_Y_MIN, DECAL_Y_MAX),
            };
            const score = minDistToSet(p, set, excludeIndex);
            if (score > bestScore) {
                bestScore = score;
                bestP = p;
                if (bestScore >= minDistTarget) {
                    // 已经够分散了，提前收工
                    //（仍然会继续采样会更分散，但没必要）
                    break;
                }
            }
        }
        return bestP || { x: rand(DECAL_X_MIN, DECAL_X_MAX), y: rand(DECAL_Y_MIN, DECAL_Y_MAX) };
    }

    function initDecalSet(container, which) {
        const key = which === "big" ? "__qxxDecalBig" : "__qxxDecalSmall";
        const prefix = which === "big" ? "--qxx-pb" : "--qxx-ps";
        const count = which === "big" ? DECAL_BIG_COUNT : DECAL_SMALL_COUNT;
        // 点数越多，可用空间越拥挤：按 sqrt(baseCount / count) 放宽目标距离
        const baseCount = which === "big" ? 4 : 6;
        const baseMinDist = which === "big" ? DECAL_BIG_BASE_MIN_DIST : DECAL_SMALL_BASE_MIN_DIST;
        const minDistTarget = baseMinDist * Math.sqrt(baseCount / count);
        const set = [];
        for (let i = 0; i < count; i++) {
            const p = proposeDispersedPoint(set, -1, minDistTarget, 48);
            set.push(p);
            setDecalPoint(container, prefix, i + 1, p.x, p.y);
        }
        container[key] = set;
    }

    function updateOneDecalPoint(container, which) {
        const key = which === "big" ? "__qxxDecalBig" : "__qxxDecalSmall";
        const prefix = which === "big" ? "--qxx-pb" : "--qxx-ps";
        const count = which === "big" ? DECAL_BIG_COUNT : DECAL_SMALL_COUNT;
        const baseCount = which === "big" ? 4 : 6;
        const baseMinDist = which === "big" ? DECAL_BIG_BASE_MIN_DIST : DECAL_SMALL_BASE_MIN_DIST;
        const minDistTarget = baseMinDist * Math.sqrt(baseCount / count);

        let set = container[key];
        if (!Array.isArray(set) || set.length !== count) {
            initDecalSet(container, which);
            set = container[key];
        }

        // 选择一个“当前最挤”的点（离最近邻最小）去挪动，整体会更分散
        let worstIdx = 0;
        let worstScore = Infinity;
        for (let i = 0; i < set.length; i++) {
            const score = minDistToSet(set[i], set, i);
            if (score < worstScore) {
                worstScore = score;
                worstIdx = i;
            }
        }

        const p = proposeDispersedPoint(set, worstIdx, minDistTarget, 48);
        set[worstIdx] = p;
        setDecalPoint(container, prefix, worstIdx + 1, p.x, p.y);
    }

    function randomizeDecal(container, changes = 1, prefix = "--qxx-ps") {
        // 兼容旧调用：prefix 决定更新 small/big
        if (!(container instanceof Element)) return;
        const which = prefix === "--qxx-ps" ? "small" : "big";
        for (let i = 0; i < changes; i++) {
            updateOneDecalPoint(container, which);
        }
    }

    function fadeDecal(container, which, toOpacity) {
        const key = which === "big" ? "--qxx-decal-big-o" : "--qxx-decal-small-o";
        container.style.setProperty(key, String(toOpacity));
    }

    function ensureStars(container) {
        if (!(container instanceof Element)) return;
        if (container.__qxxStarsInited) return;
        container.__qxxStarsInited = true;

        const layer = container.querySelector(".qxx-nameprefix__stars");
        if (!layer) return;

        // 初始化星尘双层点位（各 4 点）
        randomizeDust(layer, 4, "--qxx-da");
        randomizeDust(layer, 4, "--qxx-db");
        // 默认 A 可见，B 隐藏（CSS 里会有过渡）
        layer.style.setProperty("--qxx-dust-a", "0.16");
        layer.style.setProperty("--qxx-dust-b", "0");
        layer.__qxxDustFlip = 0;

        // 初始化贴花星点点位：用“分散撒点”策略，避免扎堆
        initDecalSet(container, "small");
        initDecalSet(container, "big");
        container.style.setProperty("--qxx-decal-small-o", "0.55");
        container.style.setProperty("--qxx-decal-big-o", "0.35");

        const dustId = setInterval(() => {
            if (!container.isConnected) {
                clearInterval(dustId);
                return;
            }
            // 极慢变化：双层交替淡入淡出，避免“点位跳变”
            const flip = (layer.__qxxDustFlip = (layer.__qxxDustFlip || 0) ^ 1);
            if (flip) {
                // 更新 B 层点位，然后淡入 B、淡出 A
                randomizeDust(layer, 2, "--qxx-db");
                layer.style.setProperty("--qxx-dust-b", "0.16");
                layer.style.setProperty("--qxx-dust-a", "0");
            } else {
                // 更新 A 层点位，然后淡入 A、淡出 B
                randomizeDust(layer, 2, "--qxx-da");
                layer.style.setProperty("--qxx-dust-a", "0.16");
                layer.style.setProperty("--qxx-dust-b", "0");
            }
        }, DUST_TICK_MS);

        // 贴花星点：淡出 -> 改点位 -> 淡入（变化慢且不突兀）
        const timeouts = [];
        const decalSmallId = setInterval(() => {
            if (!container.isConnected) {
                clearInterval(decalSmallId);
                return;
            }
            fadeDecal(container, "small", 0);
            let t;
            t = setTimeout(() => {
                randomizeDecal(container, 1, "--qxx-ps");
                fadeDecal(container, "small", 0.55);
                const idx = timeouts.indexOf(t);
                if (idx >= 0) timeouts.splice(idx, 1);
            }, DECAL_FADE_MS);
            timeouts.push(t);
        }, DECAL_SMALL_TICK_MS);

        const decalBigId = setInterval(() => {
            if (!container.isConnected) {
                clearInterval(decalBigId);
                return;
            }
            fadeDecal(container, "big", 0);
            let t;
            t = setTimeout(() => {
                randomizeDecal(container, 1, "--qxx-pb");
                fadeDecal(container, "big", 0.35);
                const idx = timeouts.indexOf(t);
                if (idx >= 0) timeouts.splice(idx, 1);
            }, DECAL_FADE_MS + 300);
            timeouts.push(t);
        }, DECAL_BIG_TICK_MS);

        intervals.set(container, { dustId, decalSmallId, decalBigId, timeouts });
    }

    function cleanup(container) {
        if (!(container instanceof Element)) return;
        const ids = intervals.get(container);
        if (!ids) return;
        if (ids.dustId) clearInterval(ids.dustId);
        if (ids.decalSmallId) clearInterval(ids.decalSmallId);
        if (ids.decalBigId) clearInterval(ids.decalBigId);
        if (ids.timeouts && Array.isArray(ids.timeouts)) {
            for (const t of ids.timeouts) clearTimeout(t);
            ids.timeouts.length = 0;
        }
        intervals.delete(container);
    }

    function scan(root) {
        if (!root) return;
        if (root instanceof Element && root.matches(".qxx-nameprefix--randstars")) {
            ensureStars(root);
        }
        if (root instanceof Element) {
            root.querySelectorAll(".qxx-nameprefix--randstars").forEach(ensureStars);
        } else {
            document.querySelectorAll(".qxx-nameprefix--randstars").forEach(ensureStars);
        }
    }

    // 先扫一遍已有元素
    scan(document);

    // 再监听后续动态插入
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                scan(n);
            }
            for (const n of m.removedNodes) {
                if (!(n instanceof Element)) continue;
                if (n.matches(".qxx-nameprefix--randstars")) cleanup(n);
                n.querySelectorAll?.(".qxx-nameprefix--randstars")?.forEach(cleanup);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

export async function precontent() {
    lib.init.css(lib.assetURL + "extension/群星闪耀/extension.css");
    setupQxxRandomNamePrefixStars();
    delete lib.extensionMenu.extension_群星闪耀.delete;
    game.import("character", () => {
        lib.translate["shiningStars_character_config"] = "群星闪耀";
        game.addGroup("shiningStar", "星", "星", {
            color: [
                [0, 176, 240, 1],
                [33, 25, 201, 1],
                [143, 170, 220, 1],
                [143, 170, 220, 0.5],
            ],
            image: "extension/群星闪耀/assets/images/group/shiningStar.png",
        });
        lib.namePrefix.set("群星", {
            getSpan: () => {
                return '<span class="qxx-nameprefix qxx-nameprefix--randstars" aria-label="群星">' + '<span class="qxx-nameprefix__stars" aria-hidden="true"></span>' + '<span class="qxx-nameprefix__char qxx-nameprefix__char--qun">群</span>' + '<span class="qxx-nameprefix__char qxx-nameprefix__char--xing">星</span>' + "</span>";
            },
        });

        return shiningStars;
    });
    await shiningStarsMode();
}
