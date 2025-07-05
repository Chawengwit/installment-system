let currentStep = 1;

initializeApp();

// Initialize application
function initializeApp() {
    setupEventListeners();
    setupNavigation();
    setupModals();
}

// Setup event listeners
function setupEventListeners() {
    // Mobile navigation toggle
    $("#navbar-toggle").on("click", () => {
        $("#navbar-menu").toggleClass("active");
    });

    // Close mobile menu when clicking outside
    $(document).on("click", (e) => {
        if (!$(e.target).closest(".navbar").length) {
            $("#navbar-menu").removeClass("active");
        }
    });

    // Form submissions
    $("#add-card-form").on("submit", handleAddCard);
    $("#installment-plan-form").on("submit", handleCreatePlan);

    // Search functionality
    $("#customer-search").on("input", debounce(handleCustomerSearch, 300));
}

// Setup modals
function setupModals() {
    // Close modal when clicking overlay
    $(".modal_overlay").on("click", function () {
        const modalId = $(this).closest(".modal").attr("id");
        closeModal(modalId);
    });

    // Close modal with Escape key
    $(document).on("keydown", (e) => {
        if (e.key === "Escape") {
            $(".modal.active").each(function () {
                closeModal($(this).attr("id"));
            });
        }
    });
}

function setupNavigation() {
    // Highlight active navigation item based on current page
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    $(".navbar_link").removeClass("navbar_link--active");
    $(`.navbar_link[href="${currentPage}"]`).addClass("navbar_link--active");
}

// Installment plan functions
function handleCreatePlan(e) {
    e.preventDefault();

    // Show loading state
    const submitBtn = $(e.target).find('button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn
        .prop("disabled", true)
        .html('<i class="fas fa-spinner fa-spin"></i> Creating...');

    // Simulate API call
    setTimeout(() => {
        showNotification("Installment plan created successfully!", "success");

        // Reset form and go back to step 1
        resetPlanForm();

        // Reset button
        submitBtn.prop("disabled", false).html(originalText);

        // Redirect to dashboard or customer page
        setTimeout(() => {
        window.location.href = "index.html";
        }, 1000);
    }, 2000);
}

function resetPlanForm() {
    currentStep = 1;
    $(".form-step").removeClass("form-step-active");
    $("#step-1").addClass("form-step-active");
    $("#installment-plan-form")[0].reset();
    $("#calculation-summary").hide();
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

function handleCustomerSearch(e) {
    const searchTerm = e.target.value.toLowerCase()

    $(".customer-card").each(function () {
        const customerName = $(this).find(".customer-card_name").text().toLowerCase();
        const customerPhone = $(this).find(".customer-card_phone").text().toLowerCase();

        if (customerName.includes(searchTerm) || customerPhone.includes(searchTerm)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

// Filter functions
function toggleFilters() {
    $("#filters-panel").slideToggle();
}

function viewPlan(planId) {
    console.log("Viewing plan:", planId)
    showNotification("Opening installment plan details...", "info");
}

function createNewPlan(customerId) {
    console.log("Creating new plan for customer:", customerId)
    window.location.href = "installments.html";
}

function exportCardData(){
    console.log("Export data setup");
}

function cardMenu(){
    console.log("Card menu setup");
}

function toggleView(){
    console.log("Toggle View mode");
}