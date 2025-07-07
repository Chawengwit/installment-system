(function ($) {
    // Define the module for the Installments page
    const PageInstallments = {
        currentStep: 1,

        // Function to initialize the page
        init: function () {
            this.displayInstallments();
            this.bindEvents();
            console.log("Installments page initialized");
        },

        // Function to bind event listeners
        bindEvents: function () {
            const $main = $("#main-content");
            $main.on("submit", "#installment-add-form", this.handleAddInstallment.bind(this));
            $main.on("input", "#installment-search", AppUtils.debounce(this.displayInstallments.bind(this), 300));
            $main.on("change", "#installment-status-filter", this.displayInstallments.bind(this));
            $main.on("click", ".btn-next-step", this.nextStep.bind(this));
            $main.on("click", ".btn-prev-step", this.prevStep.bind(this));
            $main.on("change", "#product-price, #installment-months", this.calculateInstallments.bind(this));
        },

        displayInstallments: function() {
            const container = $('#installments-list');
            if (!container.length) return;
            container.empty();

            const searchTerm = $('#installment-search').val()?.toLowerCase() || '';
            const statusFilter = $('#installment-status-filter').val();
            // Dummy data for now
            const installmentsData = [
                { id: 1, customer: 'John Doe', product: 'Laptop', amount: 1200, dueDate: '2024-07-15', status: 'active' },
                { id: 2, customer: 'Jane Smith', product: 'Smartphone', amount: 800, dueDate: '2024-07-20', status: 'pending' },
            ];

            const filtered = installmentsData.filter(inst => 
                (inst.customer.toLowerCase().includes(searchTerm) || inst.product.toLowerCase().includes(searchTerm)) &&
                (statusFilter === 'all' || inst.status === statusFilter)
            );

            if (filtered.length === 0) {
                container.append('<p>No installments found.</p>');
                return;
            }

            filtered.forEach(inst => {
                const card = this.createInstallmentCard(inst);
                container.append(card);
            });
        },

        createInstallmentCard: function(installment) {
            const statusClass = installment.status === 'active' ? 'badge-success' : 'badge-warning';
            return `
                <div class="installment-card">
                    <div class="installment-card-info">
                        <h3>Installment #${installment.id}</h3>
                        <p>Customer: ${installment.customer}</p>
                        <p>Amount: ${AppUtils.formatCurrency(installment.amount)}</p>
                        <span class="badge ${statusClass}">${installment.status}</span>
                    </div>
                    <div class="installment-card-actions">
                        <button class="btn btn-sm btn-info">View</button>
                    </div>
                </div>
            `;
        },

        handleAddInstallment: function(event) {
            event.preventDefault();
            // Logic to add installment
            window.AppUtils.showNotification('Installment added successfully!', 'success');
            this.displayInstallments();
        },

        nextStep: function(e) {
            const nextStep = $(e.currentTarget).data("step");
            if (this.validateCurrentStep()) {
                $(".form-step").removeClass("form-step-active");
                $(`#step-${nextStep}`).addClass("form-step-active");
                this.currentStep = nextStep;
                if (this.currentStep === 5) this.updateReviewSection();
            }
        },

        prevStep: function(e) {
            const prevStep = $(e.currentTarget).data("step");
            $(".form-step").removeClass("form-step-active");
            $(`#step-${prevStep}`).addClass("form-step-active");
            this.currentStep = prevStep;
        },

        validateCurrentStep: function() {
            let isValid = true;
            const currentStepElement = $(".form-step-active");
            currentStepElement.find("[required]").each(function () {
                if (!$(this).val()) {
                    $(this).addClass("error");
                    isValid = false;
                }
            });
            return isValid;
        },

        calculateInstallments: function() {
            const price = parseFloat($("#product-price").val());
            const months = parseInt($("#installment-months").val());
            const interestRate = 0.05; // 5%

            if (price > 0 && months > 0) {
                const totalAmount = price * (1 + interestRate);
                const monthlyPayment = totalAmount / months;
                $("#summary-total").text(AppUtils.formatCurrency(totalAmount));
                $("#summary-monthly").text(AppUtils.formatCurrency(monthlyPayment));
                $("#calculation-summary").slideDown();
            } else {
                $("#calculation-summary").slideUp();
            }
        },

        updateReviewSection: function() {
            $("#review-customer").text($("#customer-select option:selected").text());
            $("#review-product").text($("#product-name").val());
            $("#review-terms").text(`${$("#installment-months").val()} months`);
        },

        // Function to clean up event listeners
        destroy: function () {
            $("#main-content").off();
            console.log("Installments page destroyed");
        },
    };

    // Expose the module to the global scope
    window.PageInstallments = PageInstallments;

})(jQuery);