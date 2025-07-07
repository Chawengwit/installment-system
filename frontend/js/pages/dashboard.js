(function ($) {
    // Define the module for the Dashboard page
    const PageDashboard = {
        // Function to initialize the page
        init: function () {
            this.bindEvents();
            console.log("Dashboard page initialized");
            // Initial data loading can happen here
        },

        // Function to bind event listeners
        bindEvents: function () {
            // Example: Refresh button
            $("#main-content").on("click", ".btn-refresh-dashboard", this.handleRefresh);
        },

        // Function to handle refreshing the dashboard
        handleRefresh: function () {
            console.log("Refreshing dashboard data...");
            window.AppUtils.showNotification("Reloading dashboard...", "info");
            // Add logic to re-fetch and update dashboard widgets
        },

        // Function to clean up event listeners
        destroy: function () {
            $("#main-content").off("click", ".btn-refresh-dashboard");
            console.log("Dashboard page destroyed");
        },
    };

    // Expose the module to the global scope
    window.PageDashboard = PageDashboard;

})(jQuery);