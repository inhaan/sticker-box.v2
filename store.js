import { Sticker } from "./sticker.js";

// 스티커 store
const store = new Set();

export function getStickers() {
    return [...store];
}

export function addSticker(sticker) {
    store.add(sticker);
    saveStickers();
}

export function deleteSticker(sticker) {
    store.delete(sticker);
    saveStickers();
}

/**
 * 스티커 정보 localStorage에 저장
 * - debounce로 지연 실행하여 잦은 반복 요청에 대해 대처한다
 */
export const saveStickers = _.debounce(() => {
    const stickers = [];
    for (const sticker of store) {
        stickers.push(sticker.serialize());
    }

    localStorage.setItem("stickers", JSON.stringify(stickers));
}, 200);

/**
 * 스티커 로드
 * - localStorage에 저장된 데이터로 스티커를 다시 생성한다
 * @returns
 */
export function loadStickers() {
    const serialized = localStorage.getItem("stickers");
    if (!serialized) {
        return null;
    }

    const datas = JSON.parse(serialized);

    return datas.map((data) => {
        const sticker = Sticker.deserialize(data);
        store.add(sticker);
        return sticker.getStickerEl();
    });
}
