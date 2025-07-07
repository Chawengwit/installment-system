(function ($) {
    // Define the module for the Credit Cards page
    const PageCreditCards = {
        // Function to initialize the page
        init: function () {
            this.setupCardInteractions();
            this.setupCardFormValidation();
            this.updateCardStatistics();
            this.bindEvents();
            console.log("Credit Cards page initialized");
        },

        // Function to bind event listeners
        bindEvents: function () {
            const $main = $("#main-content");
            $main.on("submit", "#add-card-form", this.handleAddCard.bind(this));
            $main.on("click", ".btn-edit-card", this.handleEditCard.bind(this));
            $main.on("click", ".btn-delete-card", this.handleDeleteCard.bind(this));
            $main.on("click", ".btn-generate-report", this.handleGenerateReport.bind(this));
            $main.on("click", ".btn-check-balance", this.handleCheckBalance.bind(this));
        },

        setupCardInteractions: function() {
            const $main = $("#main-content");
            // Card hover effects need to be delegated since cards can be added/removed
            $main.on("mouseenter", ".credit-card", function () {
                $(this).find(".credit-card_actions").css("opacity", "1");
            });
            $main.on("mouseleave", ".credit-card", function () {
                $(this).find(".credit-card_actions").css("opacity", "0.7");
            });
            this.animateProgressBars();
        },

        setupCardFormValidation: function() {
            const $main = $("#main-content");
            // Card number formatting
            $main.on("input", '#add-card-form input[placeholder*="1234"]', function () {
                const value = $(this).val().replace(/\s/g, "");
                const formattedValue = value.replace(/(.{4})/g, "$1 ").trim();
                if (formattedValue.length <= 19) {
                    $(this).val(formattedValue);
                }
            });

            // Credit limit formatting
            $main.on("input", '#add-card-form input[placeholder="0.00"]', function () {
                const value = $(this).val().replace(/[^\d.]/g, "");
                $(this).val(value);
            });
        },

        animateProgressBars: function() {
            $(".progress_bar").each(function () {
                const $bar = $(this);
                const width = $bar.css("width");
                $bar.css("width", "0");
                setTimeout(() => {
                    $bar.css("width", width);
                }, 300);
            });
        },

        updateCardStatistics: function() {
            let totalLimit = 0;
            let totalUsed = 0;
            let cardCount = 0;

            $(".credit-card").each(function () {
                const limitText = $(this).find(".credit-card__detail-value").eq(0).text();
                const usedText = $(this).find(".credit-card__detail-value").eq(1).text();
                const limit = parseFloat(limitText.replace(/[^\d.]/g, ""));
                const used = parseFloat(usedText.replace(/[^\d.]/g, ""));

                if (!isNaN(limit) && !isNaN(used)) {
                    totalLimit += limit;
                    totalUsed += used;
                    cardCount++;
                }
            });

            const totalAvailable = totalLimit - totalUsed;
            $("#total-cards").text(cardCount);
            $("#total-limit").text(window.AppUtils.formatCurrency(totalLimit));
            $("#total-used").text(window.AppUtils.formatCurrency(totalUsed));
            $("#total-available").text(window.AppUtils.formatCurrency(totalAvailable));
        },

        handleAddCard: function (e) {
            e.preventDefault();
            const $form = $(e.currentTarget);
            const $submitBtn = $form.find('button[type="submit"]');
            const originalBtnText = $submitBtn.html();

            $submitBtn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i> Adding...');

            setTimeout(() => {
                window.AppUtils.showNotification("Credit card added successfully!", "success");
                window.AppUtils.closeModal("add-card-modal");
                $submitBtn.prop("disabled", false).html(originalBtnText);
                // In a real app, you'd fetch and re-render the card list
                this.updateCardStatistics();
            }, 1000);
        },

        handleEditCard: function(e) {
            const cardId = $(e.currentTarget).closest(".credit-card").data("card-id");
            console.log("Editing card:", cardId);
            window.AppUtils.openModal("add-card-modal"); // Re-using the add modal for edit
            window.AppUtils.showNotification("Loading card details for editing...", "info");
        },

        handleDeleteCard: function(e) {
            const cardId = $(e.currentTarget).closest(".credit-card").data("card-id");
            if (confirm("Are you sure you want to delete this credit card?")) {
                window.AppUtils.showNotification("Deleting credit card...", "info");
                setTimeout(() => {
                    $(`.credit-card[data-card-id="${cardId}"]`).fadeOut(300, () => {
                        $(this).remove();
                        this.updateCardStatistics();
                        window.AppUtils.showNotification("Credit card deleted!", "success");
                    });
                }, 1000);
            }
        },

        handleGenerateReport: function(e) {
            const cardId = $(e.currentTarget).closest(".credit-card").data("card-id");
            window.AppUtils.showNotification("Generating card usage report...", "info");
        },

        handleCheckBalance: function(e) {
            const cardId = $(e.currentTarget).closest(".credit-card").data("card-id");
            window.AppUtils.showNotification("Checking current balance...", "info");
        },

        // Function to clean up event listeners
        destroy: function () {
            $("#main-content").off();
            console.log("Credit Cards page destroyed");
        },
    };

    // Expose the module to the global scope
    window.PageCreditCards = PageCreditCards;

})(jQuery);
