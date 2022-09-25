export const EVENT_NAME = {
    stickerChange: "stickerChange",
    deleteStickerItem: "deleteStickerItem",
    moveStickerItem: "moveStikerItem",
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
