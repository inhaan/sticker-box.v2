import { Sticker } from "./sticker.js";
import { addSticker, loadStickers, saveStickers } from "./store.js";
import { EVENT_NAME } from "./util.js";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#btnCreateSticker").onclick = onClickBtnCreateSticker;

    // 스티커 변경 이벤트
    document.addEventListener(EVENT_NAME.stickerChange, () => {
        saveStickers();
    });

    // 스티커 로드
    const stickers = loadStickers();
    if (stickers) {
        const stickerContainerEl = document.querySelector("#stickerContainer");
        stickers.forEach((sticker) => {
            stickerContainerEl.append(sticker);
        });
    }
});

function onClickBtnCreateSticker() {
    const sticker = new Sticker();
    document.querySelector("#stickerContainer").append(sticker.getStickerEl());
    addSticker(sticker);
}