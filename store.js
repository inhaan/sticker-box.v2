import { Sticker } from "./sticker.js";

// 스티커 store
const store = new Set();

export function addSticker(sticker) {
    store.add(sticker);
    saveStickers();
}

export function deleteSticker(sticker) {
    store.delete(sticker);
    saveStickers();
}

export const saveStickers = _.debounce(() => {
    const stickers = [];
    for (const sticker of store) {
        stickers.push(sticker.serialize());
    }

    localStorage.setItem("stickers", JSON.stringify(stickers));
}, 200);

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
