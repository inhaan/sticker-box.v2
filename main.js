import { Sticker } from "./sticker.js";
import { addSticker, getStickers, loadStickers, saveStickers } from "./store.js";
import { EVENT_NAME } from "./customEvent.js";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#btnCreateSticker").onclick = onClickBtnCreateSticker;
    document.querySelector("#btnDeleteAllSticker").onclick = onClickBtnDeleteAllSticker;

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
    // 스티커 생성
    const sticker = new Sticker();
    document.querySelector("#stickerContainer").append(sticker.getStickerEl());
    addSticker(sticker);

    // 스티커 제목 입력
    sticker.setInputableTitle();
}

function onClickBtnDeleteAllSticker() {
    getStickers()?.forEach((sticker) => sticker.delete());
}
