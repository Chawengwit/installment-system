import { debounce, openModal, closeModal, showNotification, showConfirmationModal } from '../utils/AppUtils.js';

class PageCreditCards {
    constructor() {
        this.$mainContent = $("#main-content");
    }

    init() {
        this.bindEvents();
        console.log("Credit Cards page initialized");
    }

    destroy() {
        this.$mainContent.off();
        console.log("Credit Cards page destroyed");
    }

    bindEvents() {
        this.$mainContent.on("click", "#create-card-btn", () => openModal('add-card-modal'));
        this.$mainContent.on("click", "#add-card-modal .modal_overlay, #add-card-modal .modal_close, #cancel-add-card", () => closeModal('add-card-modal'));
        this.$mainContent.on("click", "#card-details-modal .modal_overlay, #card-details-modal .modal_close", () => closeModal('card-details-modal'));
    }
}

export default PageCreditCards;