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
    $("#add-customer-form").on("submit", handleAddCustomer);
    $("#add-card-form").on("submit", handleAddCard);
    $("#installment-plan-form").on("submit", handleCreatePlan);

    // Search functionality
    $("#customer-search").on("input", debounce(handleCustomerSearch, 300));
}

// Setup modals
function setupModals() {
    // Close modal when clicking overlay
    $(".modal__overlay").on("click", function () {
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

// Modal functions
function openModal(modalId) {
    $(`#${modalId}`).addClass("active");
    $("body").css("overflow", "hidden");
}

function closeModal(modalId) {
    $(`#${modalId}`).removeClass("active");
    $("body").css("overflow", "auto");

    // Reset form if it exists
    const form = $(`#${modalId} form`);
    if (form.length) {
        form[0].reset();
    }
}

// Customer functions

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
    $(".form-step").removeClass("form-step--active");
    $("#step-1").addClass("form-step--active");
    $("#installment-plan-form")[0].reset();
    $("#calculation-summary").hide();
}

// Filter functions
