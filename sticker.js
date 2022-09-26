import { StickerItem } from "./stickerItem.js";
import { deleteSticker } from "./store.js";
import { createStickerChangeEvent, EVENT_NAME } from "./customEvent.js";

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
        // 초기화
        this.#init(title, backgroundColor, zIndex, position, items);

        // 스티커
        const stickerEl = document.createElement("div");
        stickerEl.className = "sticker draggable";
        stickerEl.style.zIndex = this.zIndex;
        stickerEl.style.backgroundColor = this.backgroundColor;
        stickerEl.style.top = `${this.#top}px`;
        stickerEl.style.left = `${this.#left}px`;
        this.#stickerEl = stickerEl;

        // 제목
        const titleEl = document.createElement("div");
        titleEl.textContent = this.title;
        stickerEl.append(titleEl);
        this.#titleEl = titleEl;
        titleEl.onmousedown = (event) => this.#onMousedownTitle(event);

        // 항목 추가
        const btnAddItemEl = document.createElement("button");
        btnAddItemEl.textContent = "항목 추가";
        stickerEl.append(btnAddItemEl);

        // 스티커 삭제
        const btnDelStickerEl = document.createElement("button");
        btnDelStickerEl.textContent = "스티커 삭제";
        btnDelStickerEl.onclick = () => this.#onClickBtnDelSticker();
        stickerEl.append(btnDelStickerEl);

        // 항목 컨테이너
        const itemContainerEl = document.createElement("ul");
        itemContainerEl.className = "item-container droppable";
        stickerEl.append(itemContainerEl);
        this.#itemContainerEl = itemContainerEl;

        btnAddItemEl.onclick = () => this.#onClickBtnAddItem();

        // 항목 관련 이벤트 핸들링
        stickerEl.addEventListener(EVENT_NAME.deleteStickerItem, (event) => {
            this.#onDeleteItem(event.detail);
        });
        stickerEl.addEventListener(EVENT_NAME.moveStickerItem, (event) => {
            this.#onMoveItem(event.detail);
        });

        // 드래그 기능
        this.#makeDraggableSticker();
    }

    /**
     * 스티커 객체의 직렬화된 데이터로 다시 스티커 객체를 생성한다
     * @param {*} data
     * @returns
     */
    static deserialize(data) {
        // 스티커 객체 생성
        const items = data.items.map((item) => StickerItem.deserialize(item));
        const sticker = new Sticker(data.title, data.backgroundColor, data.zIndex, data.position, items);

        // 스티커 항목 요소 붙이기
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

    /**
     * 스티커 제목 입력 가능하도록 변경
     */
    setInputableTitle() {
        // 입력 요소 생성
        const inputTitleEl = document.createElement("input");
        inputTitleEl.type = "text";
        inputTitleEl.className = "input-title";
        inputTitleEl.value = this.title;
        this.#titleEl.before(inputTitleEl);

        // 수정 완료시 작업
        const completeEditing = () => {
            if (inputTitleEl.value) {
                this.title = inputTitleEl.value;
                this.#titleEl.textContent = this.title;
            }
            inputTitleEl.remove();
            this.#titleEl.classList.remove("hidden");

            // 스티커 변경 이벤트
            this.#stickerEl.dispatchEvent(createStickerChangeEvent());
        };

        // 수정 완료 이벤트 핸들링
        inputTitleEl.onkeydown = (event) => {
            if (event.key == "Enter") {
                completeEditing();
            }
        };
        inputTitleEl.onblur = () => completeEditing();

        // 원본 숨김
        this.#titleEl.classList.add("hidden");

        // 포커스 및 선택
        inputTitleEl.focus();
        inputTitleEl.select();
    }

    delete() {
        this.#stickerEl.remove();
        deleteSticker(this);
    }

    /**
     * 스티커 객체의 직렬화된 데이터를 반환한다
     * @returns
     */
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
        // 제목을 클릭할 때만 제목을 수정할 수 있도록 한다
        // 제목을 드래그하면 수정모드로 변경되지 않는다

        let isClick = true;
        const initClientX = event.clientX;
        const initClientY = event.clientY;

        this.#titleEl.onmousemove = (event) => {
            // 5px 이상 움직이면 클릭 취소
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

        // 스티커 변경 이벤트
        this.#stickerEl.dispatchEvent(createStickerChangeEvent());

        // 항목 컨텐츠 입력
        item.setInputableContent();
    }

    /**
     * 항목 삭제 이벤트 핸들링
     * @param {*} item
     */
    #onDeleteItem(item) {
        this.#items = this.#items.filter((x) => x !== item);

        // 스티커 변경 이벤트
        this.#stickerEl.dispatchEvent(createStickerChangeEvent());
    }

    /**
     * 항목 이동 이벤트 핸들링
     * @param {*} item
     */
    #onMoveItem(item) {
        // 새로운 항목 추가
        if (!this.#items.some((x) => x === item)) {
            this.#items.push(item);
        }

        // DOM 객체 확인하고 순서에 따라 새로 items 생성
        const newItems = [];
        for (const itemEl of this.#stickerEl.querySelectorAll(".item:not(.hidden)")) {
            newItems.push(this.#items.find((x) => x.id === itemEl.id));
        }
        this.#items = newItems;

        // 스티커 변경 이벤트
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

                // 스티커 변경 이벤트
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
