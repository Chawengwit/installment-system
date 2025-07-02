setupCreditCardManagement();

function setupCreditCardManagement() {
    // Setup card interactions
    setupCardInteractions();

    // Setup card form validation
    setupCardFormValidation();

    // Update card statistics
    updateCardStatistics();
}

function setupCardInteractions() {
    // Card hover effects
    $(".credit-card").each(function () {
        const $card = $(this);

        $card
        .on("mouseenter", function () {
            $(this).find(".credit-card__actions").css("opacity", "1");
        })
        .on("mouseleave", function () {
            $(this).find(".credit-card__actions").css("opacity", "0.7");
        });
    });

    // Card usage progress animation
    animateProgressBars();
}

function setupCardFormValidation() {
    // Card number formatting
    $('#add-card-form input[placeholder*="1234"]').on("input", function () {
        const value = $(this).val().replace(/\s/g, "");
        const formattedValue = value.replace(/(.{4})/g, "$1 ").trim();

        if (formattedValue.length <= 19) {
        // Max length for formatted card number
        $(this).val(formattedValue);
        }
    });

    // Credit limit formatting
    $('#add-card-form input[placeholder="0.00"]').on("input", function () {
        const value = $(this)
        .val()
        .replace(/[^\d.]/g, "");
        $(this).val(value);
    });

    // Real-time validation
    $("#add-card-form").on("input", "input", function () {
        validateCardField($(this));
    });
}

function validateCardField($field) {
    const fieldName = $field.attr("placeholder") || $field.prev("label").text();
    const value = $field.val();

    // Remove previous error states
    $field.removeClass("error");
    $field.next(".error-message").remove();

    // Validate based on field type
    if (fieldName.includes("Card Number")) {
        const cleanNumber = value.replace(/\s/g, "");
        if (cleanNumber.length > 0 && (cleanNumber.length < 13 || cleanNumber.length > 19)) {
        showFieldError($field, "Card number must be between 13-19 digits");
        }
    } else if (fieldName.includes("Credit Limit")) {
        const amount = Number.parseFloat(value);
        if (value && (isNaN(amount) || amount <= 0)) {
        showFieldError($field, "Please enter a valid amount");
        }
    }
}

function showFieldError($field, message) {
    $field.addClass("error");
    $field.after(`<span class="error-message">${message}</span>`);
}

function animateProgressBars() {
    $(".progress__bar").each(function () {
        const $bar = $(this);
        const width = $bar.css("width");

        $bar.css("width", "0");
        setTimeout(() => {
        $bar.css("width", width);
        }, 500);
    });
}

function updateCardStatistics() {
    // Calculate and update overview statistics
    let totalLimit = 0;
    let totalUsed = 0;
    let cardCount = 0;

    $(".credit-card").each(function () {
        const limitText = $(this).find(".credit-card__detail-value").eq(0).text();
        const usedText = $(this).find(".credit-card__detail-value").eq(1).text();

        const limit = Number.parseFloat(limitText.replace(/[$,]/g, ""));
        const used = Number.parseFloat(usedText.replace(/[$,]/g, ""));

        if (!isNaN(limit) && !isNaN(used)) {
        totalLimit += limit;
        totalUsed += used;
        cardCount++;
        }
    });

    const totalAvailable = totalLimit - totalUsed;

    // Update overview stats
    $(".overview-stat").eq(0).find(".overview-stat__number").text(cardCount);
    $(".overview-stat").eq(1).find(".overview-stat__number").text(window.AppUtils.formatCurrency(totalLimit));
    $(".overview-stat").eq(2).find(".overview-stat__number").text(window.AppUtils.formatCurrency(totalUsed));
    $(".overview-stat").eq(3).find(".overview-stat__number").text(window.AppUtils.formatCurrency(totalAvailable));
}

function editCard(cardId) {
    // In a real app, this would populate the form with existing card data
    console.log("Editing card:", cardId);

    // For demo, just open the add card modal
    window.AppUtils.openModal("add-card-modal");

    // You would populate the form fields here with existing data
    window.AppUtils.showNotification("Loading card details for editing...", "info");
}

function deleteCard(cardId) {
    if (confirm("Are you sure you want to delete this credit card? This action cannot be undone.")) {
        // Show loading state
        window.AppUtils.showNotification("Deleting credit card...", "info");

        // Simulate API call
        setTimeout(() => {
        // Remove card from DOM
        $(`.credit-card[data-card-id="${cardId}"]`).fadeOut(300, function () {
            $(this).remove();
            updateCardStatistics();
        });

        window.AppUtils.showNotification("Credit card deleted successfully!", "success");
        }, 1500);
    }
}

function generateCardReport(cardId) {
    window.AppUtils.showNotification("Generating card usage report...", "info");

    // Simulate report generation
    setTimeout(() => {
        window.AppUtils.showNotification("Card report generated successfully!", "success");

        // In a real app, this would trigger a download or open a new window
        console.log("Generating report for card:", cardId);
    }, 2000);
}

function checkCardBalance(cardId) {
    window.AppUtils.showNotification("Checking current balance...", "info");

    // Simulate balance check
    setTimeout(() => {
        const randomBalance = Math.floor(Math.random() * 5000) + 1000;
        window.AppUtils.showNotification(`Current available balance: ${window.AppUtils.formatCurrency(randomBalance)}`, "success");
    }, 1500);
}

function handleAddCard(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const cardData = {
        name: formData.get("name"),
        number: formData.get("number"),
        limit: formData.get("limit"),
        type: formData.get("type"),
    };

    // Show loading state
    const submitBtn = $(e.target).find('button[type="submit"]');
    const originalText = submitBtn.text();
    submitBtn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i> Adding...');

    // Simulate API call
    setTimeout(() => {
        window.AppUtils.showNotification("Credit card added successfully!", "success");
        window.AppUtils.closeModal("add-card-modal");

        // Reset button
        submitBtn.prop("disabled", false).text(originalText);

        // Refresh card list if on credit cards page
        if (window.location.pathname.includes("credit-cards")) { // Updated path check
        console.log("Refreshing credit card list...");
        }
    }, 1500);
}

function viewCardDetails(cardId) {
    console.log("Viewing card details:", cardId);
    window.AppUtils.openModal("card-details-modal");
}
