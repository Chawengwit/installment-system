import { showNotification, openModal, closeModal } from '../utils/AppUtils.js';

class PageDashboard {
    constructor() {
        this.$mainContent = $("#main-content");
    }

    init() {
        this.bindEvents();
        console.log("Dashboard page initialized");
        // Initial data loading can happen here
    }

    destroy() {
        this.$mainContent.off("click", ".btn-refresh-dashboard");
        this.$mainContent.off("click", "#add-plan-btn");
        this.$mainContent.off("click", ".modal_close");

        console.log("Dashboard page destroyed");
    }

    bindEvents() {
        this.$mainContent.on("click", ".btn-refresh-dashboard", this.handleRefresh);
        this.$mainContent.on("click", "#add-plan-btn", () => openModal('add-new-plan-modal'));
        this.$mainContent.on("click", ".modal_close", () => closeModal('add-new-plan-modal'));

    }

    handleRefresh() {
        console.log("Refreshing dashboard data...");
        showNotification("Reloading dashboard...", "info");
        // Add logic to re-fetch and update dashboard widgets
    }
}

export default PageDashboard;
