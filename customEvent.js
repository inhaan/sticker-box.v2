export const EVENT_NAME = {
    stickerChange: "stickerChange", // 스티커 변경 이벤트
    deleteStickerItem: "deleteStickerItem", // 항목 삭제 이벤트
    moveStickerItem: "moveStikerItem", // 항목 이동 이벤트
};

export function createStickerChangeEvent() {
    return new CustomEvent(EVENT_NAME.stickerChange, { bubbles: true });
}

export function createDeleteStickerItemEvent(item) {
    return new CustomEvent(EVENT_NAME.deleteStickerItem, { bubbles: true, detail: item });
}

export function createMoveStickerItem(item) {
    return new CustomEvent(EVENT_NAME.moveStickerItem, { bubbles: true, detail: item });
}
