import { StickerItem } from "./stickerItem.js";
import { deleteSticker } from "./store.js";
import { createStickerChangeEvent, EVENT_NAME } from "./util.js";

let _stickerTop = 0;
let _stickerLeft = 0;
let _stickerZIndex = 0;

export class Sticker {
    title = "";
    backgroundColor = "";
    zIndex = 0;

    #top = 0;
    #left = 0;
    #stickerEl = null;
    #titleEl = null;
    #itemContainerEl = null;
    #items = [];

    constructor(title, backgroundColor, zIndex, position, items) {
        this.#init(title, backgroundColor, zIndex, position, items);

        const stickerEl = document.createElement("div");
        stickerEl.className = "sticker draggable";
        stickerEl.style.zIndex = this.zIndex;
        stickerEl.style.backgroundColor = this.backgroundColor;
        stickerEl.style.top = `${this.#top}px`;
        stickerEl.style.left = `${this.#left}px`;
        this.#stickerEl = stickerEl;

        const titleEl = document.createElement("div");
        titleEl.textContent = this.title;
        stickerEl.append(titleEl);
        this.#titleEl = titleEl;
        titleEl.onmousedown = (event) => this.#onMousedownTitle(event);

        const btnAddItemEl = document.createElement("button");
        btnAddItemEl.textContent = "항목 추가";
        stickerEl.append(btnAddItemEl);

        const btnDelStickerEl = document.createElement("button");
        btnDelStickerEl.textContent = "스티커 삭제";
        btnDelStickerEl.onclick = () => this.#onClickBtnDelSticker();
        stickerEl.append(btnDelStickerEl);

        const itemContainerEl = document.createElement("ul");
        itemContainerEl.className = "item-container droppable";
        stickerEl.append(itemContainerEl);
        this.#itemContainerEl = itemContainerEl;

        btnAddItemEl.onclick = () => this.#onClickBtnAddItem();

        stickerEl.addEventListener(EVENT_NAME.deleteStickerItem, (event) => {
            this.#onDeleteItem(event.detail);
        });
        stickerEl.addEventListener(EVENT_NAME.moveStickerItem, (event) => {
            this.#onMoveItem(event.detail);
        });

        this.#makeDraggableSticker();
    }

    static deserialize(data) {
        const items = data.items.map((item) => StickerItem.deserialize(item));
        const sticker = new Sticker(data.title, data.backgroundColor, data.zIndex, data.position, items);

        const itemContainerEl = sticker.getItemContainerEl();
        items.forEach((item) => {
            itemContainerEl.append(item.getItemEl());
        });

        return sticker;
    }

    #init(title, backgroundColor, zIndex, position, items) {
        if (position) {
            this.#top = position.top;
            this.#left = position.left;
        } else {
            this.#top = _stickerTop = _stickerTop + 10;
            this.#left = _stickerLeft = _stickerLeft + 10;
        }
        this.title = title ?? "Sticker";
        this.backgroundColor = backgroundColor ?? this.#getRandomBackgroundColor();
        this.zIndex = zIndex ?? ++_stickerZIndex;
        if (_stickerZIndex < zIndex) {
            _stickerZIndex = zIndex + 1;
        }

        if (items) {
            this.#items = items;
        }
    }

    getStickerEl() {
        return this.#stickerEl;
    }

    getItemContainerEl() {
        return this.#itemContainerEl;
    }

    setInputableTitle() {
        const inputTitleEl = document.createElement("input");
        inputTitleEl.type = "text";
        inputTitleEl.className = "input-title";
        inputTitleEl.value = this.title;
        this.#titleEl.before(inputTitleEl);

        const completeEditing = () => {
            if (inputTitleEl.value) {
                this.title = inputTitleEl.value;
                this.#titleEl.textContent = this.title;
            }
            inputTitleEl.remove();
            this.#titleEl.classList.remove("hidden");

            this.#stickerEl.dispatchEvent(createStickerChangeEvent());
        };

        inputTitleEl.onkeydown = (event) => {
            if (event.key == "Enter") {
                completeEditing();
            }
        };
        inputTitleEl.onblur = () => completeEditing();

        this.#titleEl.classList.add("hidden");

        inputTitleEl.focus();
        inputTitleEl.select();
    }

    delete() {
        this.#stickerEl.remove();
        deleteSticker(this);
    }

    serialize() {
        return {
            title: this.title,
            backgroundColor: this.backgroundColor,
            zIndex: this.zIndex,
            position: {
                top: this.#top,
                left: this.#left,
            },
            items: this.#items.map((item) => item.serialize()),
        };
    }

    #onMousedownTitle(event) {
        let isClick = true;
        const initClientX = event.clientX;
        const initClientY = event.clientY;

        this.#titleEl.onmousemove = (event) => {
            // 5px 이상 움직인 경우에만 클릭 취소
            if (Math.abs(event.clientX - initClientX) > 5 || Math.abs(event.clientY - initClientY) > 5) {
                isClick = false;
            }
        };
        this.#titleEl.onmouseup = () => {
            this.#titleEl.onmousemove = null;
            this.#titleEl.onmouseup = null;
            if (isClick) {
                this.setInputableTitle();
            }
        };
    }

    #onClickBtnAddItem() {
        const item = new StickerItem();
        this.#items.push(item);

        const itemEl = item.getItemEl();
        this.#itemContainerEl.append(itemEl);

        this.#stickerEl.dispatchEvent(createStickerChangeEvent());

        item.setInputableContent();
    }

    #onDeleteItem(item) {
        this.#items = this.#items.filter((x) => x !== item);

        this.#stickerEl.dispatchEvent(createStickerChangeEvent());
    }

    #onMoveItem(item) {
        //새로운 항목 추가
        if (!this.#items.some((x) => x === item)) {
            this.#items.push(item);
        }

        //DOM 객체 확인하고 순서에 따라 새로 items 생성
        const newItems = [];
        for (const itemEl of this.#stickerEl.querySelectorAll(".item:not(.hidden)")) {
            newItems.push(this.#items.find((x) => x.id === itemEl.id));
        }
        this.#items = newItems;

        this.#stickerEl.dispatchEvent(createStickerChangeEvent());
    }

    #onClickBtnDelSticker() {
        this.delete();
    }

    #getRandomBackgroundColor() {
        const getRandom = () => Math.floor(Math.random() * 50 + 150);
        return `rgb(${getRandom()}, ${getRandom()}, ${getRandom()})`;
    }

    #makeDraggableSticker() {
        this.#stickerEl.ondragstart = () => false;

        this.#stickerEl.onmousedown = (event) => {
            //텍스트 선택 방지
            document.body.classList.add("noselect");

            //맨 위로 올리기
            this.#stickerEl.style.zIndex = this.zIndex = ++_stickerZIndex;

            //초기값 계산
            const clientRect = this.#stickerEl.getBoundingClientRect();
            const shiftX = event.clientX - clientRect.left;
            const shiftY = event.clientY - clientRect.top;
            const parentLeft = event.clientX - this.#stickerEl.offsetLeft - shiftX;
            const parentTop = event.clientY - this.#stickerEl.offsetTop - shiftY;

            //drag
            const onMouseMove = (event) => {
                this.#moveAt({
                    pageX: event.pageX,
                    pageY: event.pageY,
                    shiftX,
                    shiftY,
                    parentLeft,
                    parentTop,
                });
            };
            document.addEventListener("mousemove", onMouseMove);

            //drop
            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);

                //텍스트 선택 방지 해제
                document.body.classList.remove("noselect");

                this.#top = parseInt(this.#stickerEl.style.top);
                this.#left = parseInt(this.#stickerEl.style.left);

                this.#stickerEl.dispatchEvent(createStickerChangeEvent());
            };
            document.addEventListener("mouseup", onMouseUp);
        };
    }

    #moveAt({ pageX, pageY, shiftX, shiftY, parentLeft, parentTop }) {
        this.#stickerEl.style.left = pageX - parentLeft - shiftX + "px";
        this.#stickerEl.style.top = pageY - parentTop - shiftY + "px";
    }
}
