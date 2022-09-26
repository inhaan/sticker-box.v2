import { createDeleteStickerItemEvent, createMoveStickerItem, createStickerChangeEvent, EVENT_NAME } from "./util.js";

let _itemIndex = 0;

export class StickerItem {
    id = null;
    content = "";

    #itemEl = null;
    #contentEl = null;

    constructor(id, content) {
        this.id = id ?? this.#createId();

        const itemEl = document.createElement("li");
        itemEl.id = this.id;
        itemEl.className = "item droppable";
        this.#itemEl = itemEl;

        const contentEl = document.createElement("span");
        contentEl.textContent = this.content = content ?? `content`;
        contentEl.onclick = () => this.#onClickContent();
        this.#itemEl.append(contentEl);
        this.#contentEl = contentEl;

        const btnDelItemEl = document.createElement("button");
        btnDelItemEl.textContent = "삭제";
        btnDelItemEl.setAttribute("data-action", "delete");
        itemEl.append(btnDelItemEl);

        itemEl.onclick = (event) => this.#onClickItem(event);
        this.#makeDraggableItem();
    }

    static deserialize(data) {
        return new StickerItem(data.id, data.content);
    }

    getItemEl() {
        return this.#itemEl;
    }

    setInputableContent() {
        const inputContentEl = document.createElement("input");
        inputContentEl.type = "text";
        inputContentEl.className = "input-content";
        inputContentEl.value = this.content;

        this.#contentEl.before(inputContentEl);

        const completeEditing = () => {
            if (inputContentEl.value) {
                this.content = inputContentEl.value;
                this.#contentEl.textContent = this.content;
            }
            inputContentEl.remove();
            this.#contentEl.classList.remove("hidden");

            this.#itemEl.dispatchEvent(createStickerChangeEvent());
        };

        inputContentEl.onkeydown = (event) => {
            if (event.key == "Enter") {
                completeEditing();
            }
        };

        inputContentEl.onblur = () => {
            completeEditing();
        };

        this.#contentEl.classList.add("hidden");

        inputContentEl.focus();
        inputContentEl.select();
    }

    serialize() {
        return { id: this.id, content: this.content };
    }

    #createId() {
        return `item-${Date.now() + Math.random()}`;
    }

    #onClickItem(event) {
        switch (event.target.dataset.action) {
            case "delete":
                this.#deleteItem();
                break;
        }
    }

    #onClickContent() {
        this.setInputableContent();
    }

    #deleteItem() {
        this.#itemEl.dispatchEvent(createDeleteStickerItemEvent(this));
        this.#itemEl.remove();
    }

    #makeDraggableItem() {
        this.#itemEl.ondragstart = () => false;

        this.#itemEl.onmousedown = (event) => {
            //버튼 클릭시 드래그 안함
            if (event.target.dataset.action) {
                return;
            }

            //초기값 계산
            const initClientX = event.clientX;
            const initClientY = event.clientY;
            const clientRect = this.#itemEl.getBoundingClientRect();
            const shiftX = event.clientX - clientRect.left;
            const shiftY = event.clientY - clientRect.top;

            const checkMovable = (event) => {
                // 5px 이상 움직인 경우에만 이동
                if (Math.abs(event.clientX - initClientX) > 5 || Math.abs(event.clientY - initClientY) > 5) {
                    document.removeEventListener("mousemove", checkMovable);
                    this.#setMovableItem(event.pageX, event.pageY, shiftX, shiftY);
                }
            };
            document.addEventListener("mousemove", checkMovable);

            this.#itemEl.onmouseup = () => {
                document.removeEventListener("mousemove", checkMovable);
            };

            //버블링 중단
            event.stopPropagation();
        };
    }

    #setMovableItem(pageX, pageY, shiftX, shiftY) {
        //텍스트 선택 방지
        document.body.classList.add("noselect");

        //document에 복사본 만들기
        const ghostEl = this.#itemEl.cloneNode(true);
        ghostEl.className = "item ghost";
        ghostEl.style.width = `${this.#itemEl.clientWidth - 20}px`;
        ghostEl.style.height = `${this.#itemEl.clientHeight - 20}px`;
        document.body.append(ghostEl);

        //placeholder로 변경함
        const placeholderEl = document.createElement("div");
        placeholderEl.className = "placeholder";
        placeholderEl.style.height = `${this.#itemEl.clientHeight}px`;
        this.#itemEl.before(placeholderEl);
        this.#itemEl.classList.add("hidden");

        //ghostEl 위치
        this.#moveAt({ el: ghostEl, pageX, pageY, shiftX, shiftY });

        //ghostEl drag
        const mouseMoveHandler = (event) => {
            this.#onMouseMoveGhost(event, { ghostEl, placeholderEl, shiftX, shiftY });
        };
        document.addEventListener("mousemove", mouseMoveHandler);

        //ghostEl drop
        const onMoseUp = () => {
            //ghoseEl 제거
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseup", onMoseUp);
            ghostEl.remove();

            //이전 스티커에서 항목 삭제
            if (this.#itemEl.parentElement !== placeholderEl.parentElement) {
                this.#itemEl.dispatchEvent(createDeleteStickerItemEvent(this));
            }

            //항목 이동 후 placehoderEl 제거
            placeholderEl.before(this.#itemEl);
            placeholderEl.remove();
            this.#itemEl.classList.remove("hidden");

            //이동완료 이벤트
            this.#itemEl.dispatchEvent(createMoveStickerItem(this));

            //텍스트 선택 방지 해제
            document.body.classList.remove("noselect");

            this.#itemEl.dispatchEvent(createStickerChangeEvent());
        };
        document.addEventListener("mouseup", onMoseUp);
    }

    #onMouseMoveGhost(event, { ghostEl, placeholderEl, shiftX, shiftY }) {
        //ghostEl 이동
        this.#moveAt({ el: ghostEl, pageX: event.pageX, pageY: event.pageY, shiftX, shiftY });

        //중첩 요소 탐색
        ghostEl.hidden = true;
        let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
        ghostEl.hidden = false;
        if (!elemBelow) {
            return;
        }

        //placeholder 이동 (item)
        let droppableItem = elemBelow.closest(".item.droppable");
        if (droppableItem) {
            this.#moveOnItem(placeholderEl, droppableItem);
            return;
        }

        //placeholder 이동 (item-container / 빈 스티커인 경우)
        let droppableContainer = elemBelow.closest(".item-container.droppable");
        if (droppableContainer && this.#isEmptyContainer(droppableContainer)) {
            droppableContainer.append(placeholderEl);
        }
    }

    #moveAt({ el, pageX, pageY, shiftX, shiftY }) {
        el.style.left = pageX - shiftX + "px";
        el.style.top = pageY - shiftY + "px";
    }

    #moveOnItem(placeholderEl, droppableItem) {
        const placeholderTop = placeholderEl.getBoundingClientRect().top;
        const droppableTop = droppableItem.getBoundingClientRect().top;

        if (placeholderTop < droppableTop) {
            if (placeholderEl.nextElementSibling == droppableItem) {
                droppableItem.after(placeholderEl);
            } else {
                droppableItem.before(placeholderEl);
            }
        } else if (placeholderTop > droppableTop) {
            if (placeholderEl.previousElementSibling == droppableItem) {
                droppableItem.before(placeholderEl);
            } else {
                droppableItem.after(placeholderEl);
            }
        }
    }

    #isEmptyContainer(itemContainerEl) {
        return itemContainerEl.querySelectorAll(".item.droppable:not(.hidden)").length == 0;
    }
}
