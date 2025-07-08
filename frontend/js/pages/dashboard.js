import { showNotification } from '../utils/AppUtils.js';

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
        console.log("Dashboard page destroyed");
    }

    bindEvents() {
        this.$mainContent.on("click", ".btn-refresh-dashboard", this.handleRefresh);
    }

    handleRefresh() {
        console.log("Refreshing dashboard data...");
        showNotification("Reloading dashboard...", "info");
        // Add logic to re-fetch and update dashboard widgets
    }
}

export default PageDashboard;
