(function ($) {
    // Initialize global application features
    function initializeApp() {
        setupGlobalEventHandlers();
        setupGlobalModals();
    }

    // Set up event handlers that are active on all pages
    function setupGlobalEventHandlers() {
        // Toggle mobile menu
        $(document).on("click", "#navbar-toggle", function () {
            $("#navbar-menu").toggleClass("active");
        });

        // Close mobile menu when clicking outside
        $(document).on("click", (e) => {
            if (!$(e.target).closest(".navbar").length) {
                $("#navbar-menu").removeClass("active");
            }
        });
    }

    // Set up global modal behaviors (e.g., closing with ESC key)
    function setupGlobalModals() {
        $(document).on("keydown", function (e) {
            if (e.key === "Escape") {
                $(".modal.active").each(function () {
                    window.AppUtils.closeModal($(this).attr("id"));
                });
            }
        });

        $(document).on("click", ".modal_overlay", function () {
            const modalId = $(this).closest(".modal").attr("id");
            window.AppUtils.closeModal(modalId);
        });
    }

    // Expose a debounce utility globally for use in page-specific scripts
    window.AppUtils = window.AppUtils || {};
    window.AppUtils.debounce = function (func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Run the global initializer when the DOM is ready
    $(document).ready(function () {
        initializeApp();
    });

})(jQuery);