import { debounce, openModal, closeModal, showNotification } from '../utils/AppUtils.js';

function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

class PageDashboard {
    constructor() {
        this.$mainContent = $("#main-content");
        this.isCardView = true;
        this.currentPage = 1;
        this.installmentsPerPage = 10;
        this.totalInstallments = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentStep = 1; // Added for multi-step form
        this.selectedCustomerId = null;
        this.selectedCreditCardId = null;
        this.currentInstallmentId = null;
        this.startDate = null;
        this.endDate = null;
    }

    init() {
        this.bindEvents();
        this.fetchDashboardStats();
        this.fetchInstallments(true);
        this.setupCustomerModals();
        this.setupCreditCardModals();
        this.toggleView(false); // Show table view by default
        this.setupDateRangePicker();
    }

    async fetchDashboardStats() {
        try {
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }
            const stats = await response.json();

            $('#total-customers').text(stats.totalCustomers);
            $('#active-installments').text(stats.activeInstallmentsCount);
            $('#today-due-date').text(stats.todayDueDateCount);
            $('#overdue-installments').text(stats.overdueCount);
            $('#available-credit').text(`฿${stats.availableCredit.toLocaleString()}`);
            $('#cash-flow').text(`฿${stats.cashFlow.toLocaleString()}`);

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            showNotification(error.message, 'error');
        }
    }

    setupDateRangePicker() {
        const self = this;

        $('#daterange-btn').daterangepicker({
                ranges: {
                    'Today': [moment(), moment()],
                    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                },
                startDate: moment().subtract(29, 'days'),
                endDate: moment()
            },
            function(start, end) {
                self.startDate = start.format('YYYY-MM-DD');
                self.endDate = end.format('YYYY-MM-DD');
                $('#daterange-text').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
                self.handleSearch();
            }
        );

        $('#daterange-btn').on('cancel.daterangepicker', function(ev, picker) {
            self.startDate = null;
            self.endDate = null;
            $('#daterange-text').html('Date Range');
            self.handleSearch();
        });
    }

    setupCreditCardModals() {
        this.$mainContent.on("submit", "#dashboard-add-card-form", this.handleAddCreditCard.bind(this));
        this.$mainContent.on("click", "#cancel-add-card", () => closeModal('add-card-modal'));

        // Clear errors on input
        this.$mainContent.on('input', '#dashboard-add-card-form .form_input', function() {
            $(this).removeClass('form_input-error');
            $(this).next('.error-message').remove();
        });
    }

    async handleAddCreditCard(event) {
        event.preventDefault();
        const form = $(event.currentTarget);
        const cardNameInput = form.find('[name="cardName"]');
        const cardNumberInput = form.find('[name="cardNumber"]');
        const creditLimitInput = form.find('[name="creditLimit"]');

        // Clear previous errors
        form.find('.form_input').removeClass('form_input-error');
        form.find('.error-message').remove();

        const cardName = cardNameInput.val();
        const cardNumber = cardNumberInput.val();
        const creditLimit = creditLimitInput.val();

        let hasError = false;

        if (!cardName) {
            cardNameInput.addClass('form_input-error');
            cardNameInput.after('<p class="error-message">Card name is required.</p>');
            hasError = true;
        }

        if (!cardNumber) {
            cardNumberInput.addClass('form_input-error');
            cardNumberInput.after('<p class="error-message">Card number is required.</p>');
            hasError = true;
        } else if (cardNumber.replace(/\s/g, '').length < 13) {
            cardNumberInput.addClass('form_input-error');
            cardNumberInput.after('<p class="error-message">Card number is too short.</p>');
            hasError = true;
        }

        if (!creditLimit) {
            creditLimitInput.addClass('form_input-error');
            creditLimitInput.after('<p class="error-message">Credit limit is required.</p>');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        try {
            const response = await fetch('/api/credit-cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    card_name: cardName,
                    credit_limit: creditLimit
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || 'Failed to add credit card';

                if (response.status === 409) {
                    cardNumberInput.addClass('form_input-error');
                    cardNumberInput.after(`<p class="error-message">${errorMessage}</p>`);
                } else if (errorData.field) {
                    const errorInput = form.find(`[name="${errorData.field}"]`);
                    errorInput.addClass('form_input-error');
                    errorInput.after(`<p class="error-message">${errorMessage}</p>`);
                } else {
                    showNotification(errorMessage, 'error');
                }
                return;
            }

            showNotification('Credit card added successfully!', 'success');
            closeModal('add-card-modal');
            form[0].reset();
            this.fetchCreditCardsForModal();
        } catch (error) {
            console.error('Error adding credit card:', error);
            showNotification(error.message, 'error');
        }
    }

    setupCustomerModals() {
        // Add Customer Modal
        this.$mainContent.on("submit", "#add-customer-form", this.handleAddCustomer.bind(this));
        this.$mainContent.on("click", "#cancel-add-customer", () => closeModal('add-customer-modal'));

        // Clear errors on input
        this.$mainContent.on('input', '#add-customer-form .form_input', function() {
            $(this).removeClass('form_input-error');
        });

        // Edit Customer Modal (if applicable, though not directly used in dashboard for editing)
        // this.$mainContent.on("submit", "#edit-customer-form", this.handleEditCustomer.bind(this));
        // this.$mainContent.on("click", "#cancel-edit-customer", () => closeModal('edit-customer-modal'));
    }

    async handleAddCustomer(event) {
        event.preventDefault();
        const form = $(event.currentTarget);
        const nameInput = form.find('[name="name"]');
        const idCardNumberInput = form.find('[name="id_card_number"]');

        // Clear previous errors
        form.find('.form_input').removeClass('form_input-error');

        const name = nameInput.val();
        const idCardNumber = idCardNumberInput.val();

        if (!name || !idCardNumber) {
            if (!name) nameInput.addClass('form_input-error');
            if (!idCardNumber) idCardNumberInput.addClass('form_input-error');
            showNotification('Name and ID card number are required.', 'error');
            return;
        }

        const formData = new FormData(form[0]);

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || 'An unexpected error occurred. Please try again.';

                if (response.status === 409) { // Duplicate customer
                    idCardNumberInput.addClass('form_input-error');
                } else if (response.status === 400) { // Validation error from backend
                    nameInput.addClass('form_input-error');
                    idCardNumberInput.addClass('form_input-error');
                }

                showNotification(errorMessage, 'error');
                return;
            }

            const newCustomer = await response.json();
            showNotification('Customer added successfully!', 'success');
            closeModal('add-customer-modal');
            form[0].reset();

            if ($('#add-new-plan-modal').hasClass('modal-active')) {
                this.selectedCustomerId = newCustomer.id; // Select the new customer
                $('#add-new-plan-modal #customer-search-input').val(''); // Clear search input
                this.fetchCustomersForModal();
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            const friendlyErrorMessage = "Could not connect to the server. Please check your connection and try again.";
            showNotification(friendlyErrorMessage, 'error');
        }
    }

    destroy() {
        this.$mainContent.off();
        $(window).off("scroll");
    }

    bindEvents() {
        this.$mainContent.on("click", "#add-plan-btn", () => {
            this.currentInstallmentId = null; // Ensure we are in 'add' mode
            this.clearAddPlanForm();
            $('#add-new-plan-modal .modal_title').text('Add New Plan');
            $('#add-new-plan-modal #step-5-submit').text('Create Installment Plan');
            openModal('add-new-plan-modal');
        });
        this.$mainContent.on("click", ".modal_close", (event) => {
            const modalId = $(event.currentTarget).closest('.modal').attr('id');
            closeModal(modalId);
        });
        this.$mainContent.on("input", "#dashboard-search", debounce(this.handleSearch.bind(this), 300));
        this.$mainContent.on("change", "#dashboard-status-filter", this.handleStatusFilterChange.bind(this));
        this.$mainContent.on("click", "#toggle-view-btn", this.toggleView.bind(this));

        // Multi-step form navigation
        this.$mainContent.on("click", "#add-new-plan-modal .btn[data-action='next']", this.nextStep.bind(this));
        this.$mainContent.on("click", "#add-new-plan-modal .btn[data-action='prev']", this.prevStep.bind(this));

        // Calculation summary
        this.$mainContent.on('input', '#product-price, #down-payment, #installment-months, #interest-rate', this.updateCalculationSummary.bind(this));
        this.$mainContent.on("click", "#copy-summary-btn", this.copySummaryToClipboard.bind(this));

        // Clear errors on input for multi-step form
        this.$mainContent.on('input change', '#add-new-plan-modal .form_input, #add-new-plan-modal .form_select', function() {
            $(this).removeClass('form_input-error');
        });

        // Customer search within modal
        this.$mainContent.on("input", "#add-new-plan-modal #customer-search-input", debounce(this.fetchCustomersForModal.bind(this), 300));

        // Customer selection within modal
        this.$mainContent.on("click", "#add-new-plan-modal .customer-option", this.handleCustomerSelection.bind(this));

        // Add new customer from dashboard modal
        this.$mainContent.on("click", "#add-customer-from-dashboard-btn", () => {
            openModal('add-customer-modal');
        });

        this.$mainContent.on("change", "#add-new-plan-modal #product-images", this.handleImageUpload.bind(this));

        // Add new credit card from dashboard modal
        this.$mainContent.on("click", "#add-credit-card-from-dashboard-btn", () => {
            openModal('add-card-modal');
        });

        // Credit card search within modal
        this.$mainContent.on("input", "#add-new-plan-modal #credit-card-search-input", debounce(this.fetchCreditCardsForModal.bind(this), 300));

        // Credit card selection within modal
        this.$mainContent.on("click", "#add-new-plan-modal .card-option", this.handleCreditCardSelection.bind(this));

        // Payment method selection
        this.$mainContent.on("change", "#add-new-plan-modal input[name='payment-method']", this.handlePaymentMethodChange.bind(this));

        // Form submission for new plan
        this.$mainContent.on("submit", "#installment-plan-form", this.handleFormSubmission.bind(this));

        this.$mainContent.on("click", "#export-contract-btn", () => {
            // Add PDF export logic here
            showNotification('Exporting PDF...', 'info');
        });

        this.$mainContent.on("click", "#customize-term-btn", () => this.showStep(2));
        this.$mainContent.on("click", "#installment-table-body tr", this.handleViewInstallment.bind(this));
        this.$mainContent.on("click", ".mark-paid-btn", this.handleMarkPaymentAsPaid.bind(this));
        this.$mainContent.on("click", "#confirm-payment-btn", this.confirmMarkPaymentAsPaid.bind(this));
        this.$mainContent.on("click", "#cancel-confirm-payment", () => closeModal('confirmation-modal'));
        this.$mainContent.on("change", "#slip-image-upload", this.handleSlipImageUpload.bind(this));
        this.$mainContent.on("click", "#edit-installment-btn", this.handleEditInstallment.bind(this));

        $(window).on("scroll", debounce(this.handleScroll.bind(this), 100));
    }

    handleImageUpload(event) {
        const files = event.target.files;
        const previewContainer = $('#product-image-list');

        Array.from(files).forEach(file => {
            // Create a unique identifier for the file (e.g., filename + size)
            const fileIdentifier = `${file.name}-${file.size}`;

            // Check if an image with this identifier already exists in the preview
            const existingImage = previewContainer.find(`.image-list-item[data-file-id="${fileIdentifier}"]`);

            if (existingImage.length > 0) {
                showNotification(`Image "${file.name}" is already added.`, 'info');
                return; // Skip this file
            }

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageItem = $(
                        `<div class="image-list-item" data-file-id="${fileIdentifier}">
                            <img src="${e.target.result}" class="uploaded-image-preview">
                            <button type="button" class="remove-image-btn"><i class="fas fa-times-circle"></i></button>
                        </div>`
                    );
                    previewContainer.append(imageItem);

                    // Add event listener to remove button
                    imageItem.find('.remove-image-btn').on('click', function() {
                        $(this).closest('.image-list-item').remove();
                    });
                };
                reader.readAsDataURL(file);
            } else {
                showNotification('Only image files are allowed.', 'warning');
            }
        });
        showNotification(`${files.length} image(s) selected.`, 'info');

        // Clear the file input value to allow re-uploading the same file or new files immediately
        event.target.value = '';
    }

    async handleEditInstallment() {
        if (!this.currentInstallmentId) {
            showNotification('No installment selected for editing.', 'error');
            return;
        }

        closeModal('view-installment-modal');
        openModal('add-new-plan-modal');
        $('#add-new-plan-modal .modal_title').text('Edit Installment Plan');
        $('#add-new-plan-modal #step-5-submit').text('Active Installment Plan');


        try {
            const response = await fetch(`/api/installments/${this.currentInstallmentId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch installment data for editing.');
            }
            const data = await response.json();
            const { installment, customer, creditCard } = data;

            // Pre-fill the form with the fetched data
            $('#product-name').val(installment.product_name);
            $('#product-serial-number').val(installment.product_serial_number);
            $('#product-price').val(installment.product_price);
            $('#down-payment').val(installment.down_payment);
            $('#product-description').val(installment.product_description);
            $('#installment-months').val(installment.term_months);
            $('#interest-rate').val(installment.interest_rate);
            $('#payment-due-date').val(installment.due_date);
            $('#late-fee').val(installment.late_fee);

            this.selectedCustomerId = installment.customer_id;
            this.selectedCreditCardId = installment.credit_card_id;

            // Handle image previews
            const imagePreviewContainer = $('#product-image-list');
            imagePreviewContainer.empty();
            if (installment.product_images) {
                let productImages = installment.product_images;
                if (typeof productImages === 'string') {
                    try {
                        productImages = JSON.parse(productImages);
                    } catch (e) {
                        console.error('Error parsing product_images JSON:', e);
                        productImages = [];
                    }
                }

                if (Array.isArray(productImages) && productImages.length > 0) {
                    productImages.forEach(imageUrl => {
                        const imageItem = $(
                            `<div class="image-list-item">
                                <img src="/uploads/${imageUrl}" class="uploaded-image-preview">
                                <button type="button" class="remove-image-btn"><i class="fas fa-times-circle"></i></button>
                            </div>`
                        );
                        imagePreviewContainer.append(imageItem);
                    });
                }
            }

            // Directly display the selected customer in edit mode
            const customerOptionsContainer = $('#add-new-plan-modal .customer-options');
            customerOptionsContainer.empty(); // Clear any loading messages or previous content
            if (customer) {
                customerOptionsContainer.append(this.createCustomerOption(customer, true));
            } else {
                console.error('Customer data not found for this installment.');
                customerOptionsContainer.html('<p class="text-danger">Error: Customer data missing.</p>');
            }

            // Directly display the selected credit card in edit mode
            const cardOptionsContainer = $('#add-new-plan-modal .card-selection');
            cardOptionsContainer.empty();
            if (creditCard) {
                cardOptionsContainer.append(this.createCreditCardOption(creditCard, true));
            } else {
                console.error('Credit card data not found for this installment.');
                cardOptionsContainer.html('<p class="text-danger">Error: Credit Card data missing.</p>');
            }

            this.updateCalculationSummary();
            this.showStep(1);
        } catch (error) {
            console.error('Error pre-filling installment form:', error);
            showNotification(error.message, 'error');
            closeModal('add-new-plan-modal');
        }
    }

    ""

    

    clearAddPlanForm() {
        $('#installment-plan-form')[0].reset();
        $('#product-image-list').empty();
        $('#add-new-plan-modal .customer-option').removeClass('customer-option-selected');
        this.selectedCustomerId = null;
        this.currentInstallmentId = null; // Reset currentInstallmentId

        // Reset completion step text to default (for "create" mode)
        $('#step-6 .form-step_title').html('<span class="form-step_number">6</span> Plan Created Successfully');
        $('#step-6 .form-step_description').text('The installment plan is now active.');
        $('#step-6 .complated-desc').text('The installment plan has been successfully created and is now active. You can view the details of the plan in the main dashboard.');

        this.showStep(1);
    }

    async handleFormSubmission(event) {
        event.preventDefault();
        const form = $('#installment-plan-form');
        const formData = new FormData();

        formData.append('productName', form.find('#product-name').val());
        formData.append('productSerialNumber', form.find('#product-serial-number').val());
        formData.append('productPrice', form.find('#product-price').val());
        formData.append('downPayment', form.find('#down-payment').val());
        formData.append('productDescription', form.find('#product-description').val());
        formData.append('installmentMonths', form.find('#installment-months').val());
        formData.append('interestRate', form.find('#interest-rate').val());
        formData.append('paymentDueDate', form.find('#payment-due-date').val());
        formData.append('lateFee', form.find('#late-fee').val());
        formData.append('customerId', this.selectedCustomerId);
        formData.append('creditCardId', this.selectedCreditCardId);

        const imageInput = form.find('#product-images')[0];
        const dataTransfer = new DataTransfer();
        $('#product-image-list .image-list-item').each(function () {
            const src = $(this).find('img').attr('src');
            if (src.startsWith('data:image')) { // New image
                const file = dataURLtoFile(src, `image-${Date.now()}.png`);
                dataTransfer.items.add(file);
            }
        });
        const imageFiles = dataTransfer.files;

        if (imageFiles) {
            for (let i = 0; i < imageFiles.length; i++) {
                formData.append('productImages', imageFiles[i]);
            }
        }

        const url = this.currentInstallmentId ? `/api/installments/${this.currentInstallmentId}` : '/api/installments';
        const method = this.currentInstallmentId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${this.currentInstallmentId ? 'update' : 'create'} installment plan`);
            }

            const result = await response.json();
            this.newInstallmentId = result.installmentId;

            if (this.currentInstallmentId) {
                // It was an update
                $('#step-6 .form-step_title').html('<span class="form-step_number">6</span> Plan Updated & Activated');
                $('#step-6 .form-step_description').text('The installment plan has been successfully updated and activated.');
                $('#step-6 .complated-desc').text('The installment plan has been successfully updated and is now active. The payment schedule has been regenerated. You can view the updated details in the main dashboard.');
            } else {
                // It was a creation
                $('#step-6 .form-step_title').html('<span class="form-step_number">6</span> Plan Created Successfully');
                $('#step-6 .form-step_description').text('The installment plan is now active.');
                $('#step-6 .complated-desc').text('The installment plan has been successfully created and is now active. You can view the details of the plan in the main dashboard.');
            }

            showNotification(`Installment plan ${this.currentInstallmentId ? 'updated and activated' : 'created'} successfully!`, 'success');
            this.fetchInstallments(true); // Refresh the installment list
            this.clearAddPlanForm(); // Clear the form for next use
            this.showStep(6);

        } catch (error) {
            console.error(`Error ${this.currentInstallmentId ? 'updating' : 'creating'} installment plan:`, error);
            showNotification(error.message, 'error');
        }
    }

    showStep(stepNumber) {
        this.currentStep = stepNumber;
        $('#add-new-plan-modal .form-step').removeClass('form-step-active');
        $('#add-new-plan-modal #step-' + stepNumber).addClass('form-step-active');

        if (stepNumber === 3) {
            if (this.currentInstallmentId) { // Edit mode
                $('#step-3 .search-section').hide();
                const title = $('#step-3 .form-step_title');
                title.html('<span class="form-step_number">3</span> Customer Selected');
                $('#step-3 .form-step_description').text('The customer for this installment is fixed and cannot be changed during an edit.');
            } else { // Add mode
                $('#step-3 .search-section').show();
                const title = $('#step-3 .form-step_title');
                title.html('<span class="form-step_number">3</span> Select Customer');
                $('#step-3 .form-step_description').text('Choose an existing customer or add a new one');
                this.fetchCustomersForModal(); // Call only in add mode
            }
        } else if (stepNumber === 4) {
            if (this.currentInstallmentId) { // Edit mode
                $('#step-4 .search-section').hide();
                const title = $('#step-4 .form-step_title');
                title.html('<span class="form-step_number">4</span> Payment Method');
                $('#step-4 .form-step_description').text('The credit card for this installment is fixed and cannot be changed during an edit.');
            } else { // Add mode
                $('#step-4 .search-section').show();
                const title = $('#step-4 .form-step_title');
                title.html('<span class="form-step_number">4</span> Payment Method');
                $('#step-4 .form-step_description').text('Choose how the customer will make payments');
            }
            this.fetchCreditCardsForModal();
        } else if (stepNumber === 5) {
            this.updateReviewStep();
        }

        $('#add-new-plan-modal .progress-indicator_step').removeClass('progress-indicator_step-active progress-indicator_step-completed');
        for (let i = 1; i <= stepNumber; i++) {
            $('#add-new-plan-modal .progress-indicator_step[data-step="' + i + '"]').addClass('progress-indicator_step-active');
            if (i < stepNumber) {
                $('#add-new-plan-modal .progress-indicator_step[data-step="' + i + '"]').addClass('progress-indicator_step-completed');
            }
        }
    }

    nextStep() {
        if (this.validateStep(this.currentStep)) {
            if (this.currentStep < 6) { // Assuming 6 steps
                this.showStep(this.currentStep + 1);
            }
        }
    }

    copySummaryToClipboard() {
        const summaryText = [
            `Product Price: ${$('#summary-price').text()}`,
            `Down Payment: ${$('#summary-down-payment').text()}`,
            // `Financed Amount: ${$('#summary-financed').text()}`,
            // `Interest Rate: ${$('#summary-interest-rate').text()}`,
            // `Interest Amount: ${$('#summary-interest-amount').text()}`,
            // `Total Amount: ${$('#summary-total').text()}`,
            `Monthly Payment: ${$('#summary-monthly').text()}`,
            `Number of Payments: ${$('#summary-payments').text()}`,
        ].join('\n');

        navigator.clipboard.writeText(summaryText)
            .then(() => showNotification('Summary copied to clipboard!', 'success'))
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showNotification('Failed to copy summary.', 'error');
            });
    }

    updateCalculationSummary() {
        const form = $('#installment-plan-form');
        const productPrice = parseFloat(form.find('#product-price').val()) || 0;
        const downPayment = parseFloat(form.find('#down-payment').val()) || 0;
        const installmentMonths = parseInt(form.find('#installment-months').val(), 10) || 0;
        const interestRate = parseFloat(form.find('#interest-rate').val()) || 0;

        const financedAmount = productPrice - downPayment;
        const interestAmount = financedAmount * (interestRate / 100);
        const totalAmount = financedAmount + interestAmount;
        const monthlyPayment = installmentMonths > 0 ? totalAmount / installmentMonths : 0;

        $('#summary-price').text(`฿${productPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        $('#summary-down-payment').text(`฿${downPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        $('#summary-financed').text(`฿${financedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        $('#summary-interest-rate').text(`${interestRate.toFixed(1)}%`);
        $('#summary-interest-amount').text(`฿${interestAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        $('#summary-total').text(`฿${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        $('#summary-monthly').text(`฿${monthlyPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        $('#summary-payments').text(installmentMonths);

        $('#calculation-summary').show();
    }

    validateStep(stepNumber) {
        let isValid = true;
        const currentStepElement = $('#step-' + stepNumber);

        // Clear previous errors
        currentStepElement.find('.form_input, .form_select').removeClass('form_input-error');

        switch (stepNumber) {
            case 1: // Product Details
                const productName = currentStepElement.find('#product-name').val();
                const productPrice = currentStepElement.find('#product-price').val();

                if (!productName) {
                    currentStepElement.find('#product-name').addClass('form_input-error');
                    isValid = false;
                }
                if (!productPrice || parseFloat(productPrice) <= 0) {
                    currentStepElement.find('#product-price').addClass('form_input-error');
                    isValid = false;
                }
                if (!isValid) showNotification('Please fill in all required product details.', 'error');
                break;
            case 2: // Installment Terms
                const installmentMonths = currentStepElement.find('#installment-months').val();
                const interestRate = currentStepElement.find('#interest-rate').val();
                const paymentDueDate = currentStepElement.find('#payment-due-date').val();

                if (!installmentMonths) {
                    currentStepElement.find('#installment-months').addClass('form_input-error');
                    isValid = false;
                }
                if (!interestRate) {
                    currentStepElement.find('#interest-rate').addClass('form_input-error');
                    isValid = false;
                }
                if (!paymentDueDate) {
                    currentStepElement.find('#payment-due-date').addClass('form_input-error');
                    isValid = false;
                } else {
                    const day = parseInt(paymentDueDate, 10);
                    if (isNaN(day) || day < 1 || day > 31) {
                        currentStepElement.find('#payment-due-date').addClass('form_input-error');
                        showNotification('Please enter a valid day of the month (1-31).', 'error');
                        isValid = false;
                    }
                }
                if (!isValid) showNotification('Please fill in all required installment terms.', 'error');
                break;
            case 3: // Customer Selection
                if (!this.selectedCustomerId) {
                    showNotification('Please select a customer.', 'error');
                    isValid = false;
                }
                break;
            case 4: // Payment Method
                const cardSelectionContainer = currentStepElement.find('.card-selection');

                // Clear previous errors
                cardSelectionContainer.removeClass('card-selection-error');
                cardSelectionContainer.find('.error-message').remove();

                if (!this.selectedCreditCardId) {
                    showNotification('Please select a credit card.', 'error');
                    isValid = false;
                }
                break;
        }
        return isValid;
    }

    updateReviewStep() {
        const form = $('#installment-plan-form');
        const productName = form.find('#product-name').val();
        const productSerialNumber = form.find('#product-serial-number').val();
        const productPrice = form.find('#product-price').val();
        const downPayment = form.find('#down-payment').val();
        const productDescription = form.find('#product-description').val();
        const installmentMonths = form.find('#installment-months').val();
        const interestRate = form.find('#interest-rate').val();
        const paymentDueDate = form.find('#payment-due-date').val();
        const customerName = $('#add-new-plan-modal .customer-option-selected .customer-option_name').text();
        const customerPhone = $('#add-new-plan-modal .customer-option-selected .customer-option_details').text().split('•')[0].trim();
        const cardName = $('#add-new-plan-modal .card-option-selected .card-option_name').text();

        // Update Review Product section
        $('#review-product').html(`
            <p><strong>Name:</strong> ${productName}</p>
            <p><strong>Serial Number:</strong> ${productSerialNumber || 'N/A'}</p>
            <p><strong>Price:</strong> ฿${parseFloat(productPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <p><strong>Down Payment:</strong> ฿${parseFloat(downPayment).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <p><strong>Description:</strong> ${productDescription || 'N/A'}</p>
        `);

        // Update Review Terms section
        const summaryPrice = $('#summary-price').text();
        const summaryDownPayment = $('#summary-down-payment').text();
        const summaryFinanced = $('#summary-financed').text();
        const summaryInterestRate = $('#summary-interest-rate').text();
        const summaryInterestAmount = $('#summary-interest-amount').text();
        const summaryTotal = $('#summary-total').text();
        const summaryMonthly = $('#summary-monthly').text();
        const summaryPayments = $('#summary-payments').text();

        $('#review-terms').html(`
            <p><strong>Product Price:</strong> ${summaryPrice}</p>
            <p><strong>Down Payment:</strong> ${summaryDownPayment}</p>
            <p><strong>Financed Amount:</strong> ${summaryFinanced}</p>
            <p><strong>Interest Rate:</strong> ${summaryInterestRate}</p>
            <p><strong>Interest Amount:</strong> ${summaryInterestAmount}</p>
            <p><strong>Total Amount:</strong> ${summaryTotal}</p>
            <p><strong>Monthly Payment:</strong> ${summaryMonthly}</p>
            <p><strong>Number of Payments:</strong> ${summaryPayments}</p>
        `);

        $('#review-customer').text(`${customerName} - ${customerPhone}`);
        $('#review-payment-method').text(`Credit Card - ${cardName}`);
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    async fetchCustomersForModal(event) {
        const search = event ? $(event.target).val().toLowerCase() : '';
        const customerOptionsContainer = $('#add-new-plan-modal .customer-options');
        customerOptionsContainer.html('<p>Loading customers...</p>');

        try {
            let customers = [];

            // This function is now only called in 'Add mode' for customer selection
            const response = await fetch(`/api/customers?search=${search}&limit=5&sortBy=created_at&sortOrder=DESC`);
            if (!response.ok) throw new Error('Failed to fetch customers for modal');
            const data = await response.json();
            customers = data.customers; 

            customerOptionsContainer.html(''); // Clear loading message
            if (customers && customers.length > 0) {
                customers.forEach(customer => {
                    const isSelected = (this.selectedCustomerId && this.selectedCustomerId === customer.id);
                    customerOptionsContainer.append(this.createCustomerOption(customer, isSelected));
                });
            } else {
                customerOptionsContainer.html('<p>No customers found.</p>');
            }
        } catch (error) {
            console.error('Error fetching customers for modal:', error);
            customerOptionsContainer.html('<p class="text-danger">Error loading customers.</p>');
            showNotification(error.message, 'error');
        }
    }

    handleCustomerSelection(event) {
        if (this.currentInstallmentId) {
            return; // Do not allow customer change in edit mode
        }

        const $selectedOption = $(event.currentTarget);
        const customerId = $selectedOption.data('customer-id');

        // Remove selected class from all options
        $('#add-new-plan-modal .customer-option').removeClass('customer-option-selected');

        // Add selected class to the clicked option
        $selectedOption.addClass('customer-option-selected');

        // Store the selected customer ID
        this.selectedCustomerId = customerId;

        // Optionally, update a hidden input or display area with the selected customer's name/ID
        // For example, if you have an input field for the selected customer:
        // $('#selected-customer-display').text($selectedOption.find('.customer-option_name').text());
        showNotification(`Customer selected: ${$selectedOption.find('.customer-option_name').text()}`, 'info');
    }

    createCustomerOption(customer, isSelected) {
        const selectedClass = isSelected ? 'customer-option-selected' : '';
        const nickname = customer.nickname ? `(${customer.nickname})` : '';
        return `
            <div class="customer-option ${selectedClass}" data-customer-id="${customer.id}">
                <div class="customer-option_avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="customer-option_info">
                    <h4 class="customer-option_name">${customer.name} ${nickname}</h4>
                    <p class="customer-option_details">${customer.phone}</p>
                </div>
            </div>
        `;
    }

    async fetchCreditCardsForModal(event) {
        const search = event ? $(event.target).val() : '';
        const cardOptionsContainer = $('#add-new-plan-modal .card-selection');
        cardOptionsContainer.html('<p>Loading credit cards...</p>');

        try {
            let cards = [];
            if (this.currentInstallmentId && this.selectedCreditCardId) {
                // Edit mode: Fetch only the selected credit card
                const selectedCardResponse = await fetch(`/api/credit-cards/${this.selectedCreditCardId}`);
                if (!selectedCardResponse.ok) throw new Error('Failed to fetch selected credit card details');
                const selectedCard = await selectedCardResponse.json();
                if (selectedCard) {
                    cards.push(selectedCard);
                }
            } else {
                // Add mode: Fetch all available credit cards
                const response = await fetch(`/api/credit-cards?search=${search}&limit=5`);
                if (!response.ok) throw new Error('Failed to fetch credit cards for modal');
                const data = await response.json();
                cards = data.credit_cards;
            }

            cardOptionsContainer.html('');
            if (cards && cards.length > 0) {
                cards.forEach(card => {
                    const isSelected = (this.selectedCreditCardId && this.selectedCreditCardId === card.id);
                    cardOptionsContainer.append(this.createCreditCardOption(card, isSelected));
                });
            } else {
                cardOptionsContainer.html('<p>No credit cards found.</p>');
            }
        } catch (error) {
            console.error('Error fetching credit cards for modal:', error);
            cardOptionsContainer.html('<p class="text-danger">Error loading credit cards.</p>');
            showNotification(error.message, 'error');
        }
    }

    handleCreditCardSelection(event) {
        if (this.currentInstallmentId) {
            showNotification('The credit card cannot be changed when editing an installment plan.', 'warning');
            return; // Prevent changing the card in edit mode
        }

        const $selectedOption = $(event.currentTarget);
        const cardId = $selectedOption.data('card-id');

        $('#add-new-plan-modal .card-option').removeClass('card-option-selected');

        $selectedOption.addClass('card-option-selected');

        this.selectedCreditCardId = cardId;

        // Remove error styling from the container
        const cardSelectionContainer = $('#add-new-plan-modal .card-selection');
        cardSelectionContainer.find('.error-message').remove();

        showNotification(`Credit Card selected: ${$selectedOption.find('.card-option_name').text()}`, 'info');
    }

    handlePaymentMethodChange(event) {
        const selectedMethod = $(event.currentTarget).val();
        const creditCardSelectContainer = $('#credit-card-select');
        const cardSelectionContainer = $('#add-new-plan-modal .card-selection');

        if (selectedMethod === 'credit-card') {
            creditCardSelectContainer.show();
            this.fetchCreditCardsForModal(); // Fetch cards when credit card option is selected
        } else {
            creditCardSelectContainer.hide();
            this.selectedCreditCardId = null; // Clear selection if not credit card
            cardSelectionContainer.find('.error-message').remove();
        }
    }

    createCreditCardOption(card, isSelected) {
        const selectedClass = isSelected ? 'card-option-selected' : '';
        return `
            <div class="card-option ${selectedClass}" data-card-id="${card.id}">
                <div class="card-option_brand">
                    <i class="fab fa-cc-visa"></i>
                </div>
                <div class="card-option_info">
                    <span class="card-option_name">${card.card_name}</span>
                </div>
                <div class="card-option_limit">
                    <span class="card-option_available"><span class="card-available-amount">${(card.credit_limit - card.used_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> <span class="card-available-text">available</span></span>
                </div>
            </div>
        `;
    }

    handleStatusFilterChange(event) {
        const $select = $(event.currentTarget);
        const status = $select.val();
        $select.removeClass('badge-primary badge-danger badge-success');
        if (status === 'active') {
            $select.addClass('badge-primary');
        } else if (status === 'non-active') {
            $select.addClass('badge-danger');
        } else if (status === 'completed') {
            $select.addClass('badge-success');
        }
        this.handleSearch();
    }

    handleSearch() {
        this.currentPage = 1;
        this.hasMore = true;
        const searchTerm = $('#dashboard-search').val().toLowerCase();
        const status = $('#dashboard-status-filter').val();
        this.fetchInstallments(true, searchTerm, status, this.startDate, this.endDate);
    }

    async fetchInstallments(clearExisting = false, search = '', status = 'all', startDate = null, endDate = null) {
        if (this.isLoading || !this.hasMore) {
            return;
        }

        this.isLoading = true;
        $('#infinite-scroll-loading').show();

        const offset = (this.currentPage - 1) * this.installmentsPerPage;
        let url = `/api/installments?search=${search}&status=${status}&limit=${this.installmentsPerPage}&offset=${offset}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch installment plans');
            const data = await response.json();

            this.totalInstallments = data.totalInstallments;
            this.hasMore = (this.currentPage * this.installmentsPerPage) < this.totalInstallments;

            this.renderInstallments(data.installments, clearExisting);
            this.currentPage++;
        } catch (error) {
            console.error('Error fetching installment plans:', error);
            showNotification(error.message, 'error');
        } finally {
            this.isLoading = false;
            $('#infinite-scroll-loading').hide();
        }
    }

    renderInstallments(installments, clearExisting) {
        const installmentGrid = $('#installments-grid');
        const installmentTableBody = $('#installment-table-body');

        if (clearExisting) {
            installmentGrid.html('');
            installmentTableBody.html('');
        }

        if (installments.length === 0 && clearExisting) {
            installmentGrid.html('<p>No installment plans found.</p>');
            installmentTableBody.html('<tr><td colspan="3">No installment plans found.</td></tr>');
            return;
        } else if (installments.length === 0 && !clearExisting) {
            return;
        }

        installments.forEach(installment => {
            const installmentCard = this.createInstallmentCard(installment);
            const installmentTableRow = this.createInstallmentTableRow(installment);
            installmentGrid.append(installmentCard);
            installmentTableBody.append(installmentTableRow);
        });
    }

    createInstallmentCard(installment) {
        // Card template to be filled
        return `
            <div class="installment-card" data-installment-id="${installment.id}">
                
            </div>
        `;
    }

    createInstallmentTableRow(installment) {
        const nextDueDate = installment.next_due_date ? new Intl.DateTimeFormat('en-GB').format(new Date(installment.next_due_date)) : 'N/A';
        const statusBadge = this.createStatusBadge(installment.status);

        return `
            <tr data-installment-id="${installment.id}">
                <td>
                    <div class="product-info">
                        <span class="product-name">${installment.product_name}</span><br>
                        <span class="product-serial">${installment.serial_number}</span>
                    </div>
                </td>
                <td>
                    <div class="customer-info">
                        <span class="customer-name">${installment.customer_name}</span><br>
                        <a href="tel:${installment.customer_phone}" class="customer-phone">${installment.customer_phone}</a>
                    </div>
                </td>
                <td class="text-center">
                    <div class="due-date-info">
                        <span class="monthly-payment">฿${parseFloat(installment.monthly_payment).toLocaleString()}</span><br>
                        <span class="due-date">${nextDueDate}</span>
                    </div>
                </td>
                <td class="text-center">
                    ${statusBadge}
                </td>
            </tr>
        `;
    }

    createStatusBadge(status) {
        const statusMap = {
            'active': 'badge-primary',
            'non-active': 'badge-danger',
            'completed': 'badge-success',
            'overdue': 'badge-warning'
        };
        const badgeClass = statusMap[status] || 'badge-secondary';
        return `<span class="badge ${badgeClass}">${status}</span>`;
    }

    toggleView(isCard = this.isCardView) {
        this.isCardView = isCard;
        const installmentGrid = $('#installments-grid');
        const installmentTableView = $('#installment-table-view');
        const toggleViewBtn = $('#toggle-view-btn');

        if (this.isCardView) {
            installmentGrid.show();
            installmentTableView.hide();
            toggleViewBtn.html('<i class="fas fa-table"></i> Table View');
        } else {
            installmentGrid.hide();
            installmentTableView.show();
            toggleViewBtn.html('<i class="fas fa-th-large"></i> Card View');
        }
    }

    async handleViewInstallment(event) {
        const installmentId = $(event.currentTarget).data('installment-id');

        if (!installmentId) {
            showNotification('Installment ID not found.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/installments/${installmentId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch installment details.');
            }
            const { installment, customer, creditCard } = await response.json();

            this.currentInstallmentId = installment.id;

            // Show/hide edit button based on status
            if (installment.status === 'non-active') {
                $('#edit-installment-btn').show();
            } else {
                $('#edit-installment-btn').hide();
            }

            // Populate Customer Information
            $('#view-customer-name').text(customer ? customer.name : 'N/A');
            $('#view-customer-phone').text(customer ? customer.phone : 'N/A');
            $('#view-customer-id-card').text(customer ? customer.id_card_number : 'N/A');

            // Populate Product Details
            $('#view-product-name').text(installment.product_name);
            $('#view-product-serial').text(installment.product_serial_number);
            $('#view-product-price').text(`฿${parseFloat(installment.product_price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            $('#view-down-payment').text(`฿${parseFloat(installment.down_payment).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            $('#view-product-description').text(installment.product_description || 'N/A');
            
            const productImagesContainer = $('#view-product-images');
            productImagesContainer.empty();
            let images = installment.product_images;
            if (typeof images === 'string') {
                try {
                    images = JSON.parse(images);
                } catch (e) {
                    console.error("Error parsing product images JSON", e);
                    images = [];
                }
            }

            if (Array.isArray(images) && images.length > 0) {
                images.forEach(image => {
                    productImagesContainer.append(`<img src="/uploads/${image}" alt="Product Image" class="img-thumbnail">`);
                });
            } else {
                productImagesContainer.append('<p>No images available.</p>');
            }

            // Populate Plan Overview
            $('#view-total-amount').text(`฿${parseFloat(installment.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            $('#view-monthly-payment').text(`฿${parseFloat(installment.monthly_payment).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            $('#view-interest-rate').text(`${parseFloat(installment.interest_rate).toFixed(1)}%`);
            $('#view-term-months').text(`${installment.term_months} months`);
            
            const statusBadge = this.createStatusBadge(installment.status);
            $('#view-status').html(statusBadge);

            $('#view-start-date').text(new Date(installment.start_date).toLocaleDateString());
            $('#view-payment-due-day').text(installment.due_date);
            $('#view-late-fee').text(`฿${parseFloat(installment.late_fee || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);

            // Populate Payment Method
            $('#view-card-name').text(creditCard ? creditCard.card_name : 'N/A');
            $('#view-credit-limit').text(creditCard ? `฿${parseFloat(creditCard.credit_limit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`: 'N/A');

            // Populate Payment Schedule
            const paymentScheduleBody = $('#view-payment-schedule-body');
            paymentScheduleBody.empty();
            if (installment.payment_schedule && installment.payment_schedule.length > 0) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                installment.payment_schedule.forEach(payment => {
                    let actionsHtml;
                    if (payment.is_paid) {
                        actionsHtml = `<span class="badge badge-success">Paid</span>`;
                    } else {
                        const dueDate = new Date(payment.due_date);
                        const isOverdue = dueDate < today;
                        const buttonClass = isOverdue ? 'btn-danger' : 'btn-primary';
                        actionsHtml = `<button class="btn btn-sm ${buttonClass} mark-paid-btn" data-payment-id="${payment.id}" data-installment-id="${installment.id}" data-payment-amount="${payment.amount}"><i class="fas fa-check"></i> Mark Paid</button>`;
                    }

                    paymentScheduleBody.append(`
                        <tr>
                            <td>${payment.term_number}</td>
                            <td>${new Date(payment.due_date).toLocaleDateString()}</td>
                            <td>฿${parseFloat(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td class="text-right">${actionsHtml}</td>
                        </tr>
                    `);
                });
            } else {
                paymentScheduleBody.append('<tr><td colspan="4">No payment schedule available.</td></tr>');
            }

            openModal('view-installment-modal');

        } catch (error) {
            console.error('Error viewing installment:', error);
            showNotification(error.message, 'error');
        }
    }

    handleMarkPaymentAsPaid(event) {
        const paymentId = $(event.currentTarget).data('payment-id');
        const installmentId = $(event.currentTarget).data('installment-id');
        const paymentAmount = $(event.currentTarget).data('payment-amount');

        // Store these values temporarily for the confirmation modal
        this.currentPaymentToMarkPaid = { paymentId, installmentId, paymentAmount };

        // Clear any previous image preview
        $('#slip-image-preview').empty();
        $('#slip-image-upload').val('');

        openModal('confirmation-modal');
    }

    async confirmMarkPaymentAsPaid() {
        const { paymentId, installmentId, paymentAmount } = this.currentPaymentToMarkPaid;

        if (!paymentId || !installmentId || !paymentAmount) {
            showNotification('Missing payment details for confirmation.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('paid_amount', paymentAmount);
        formData.append('installment_id', installmentId);

        const slipImageInput = $('#slip-image-upload')[0];
        if (slipImageInput.files.length > 0) {
            formData.append('slip_image', slipImageInput.files[0]);
        }

        try {
            const response = await fetch(`/api/installment-payment/${paymentId}/mark-paid`, {
                method: 'PUT',
                body: formData // FormData handles Content-Type automatically for file uploads
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to mark payment as paid.');
            }

            showNotification('Payment marked as paid successfully!', 'success');
            closeModal('confirmation-modal');
            // Re-fetch installment details to update the modal and table
            this.handleViewInstallment({ currentTarget: $(`#installment-table-body tr[data-installment-id="${installmentId}"]`) });
            this.fetchInstallments(true); // Refresh main table

        } catch (error) {
            console.error('Error marking payment as paid:', error);
            showNotification(error.message, 'error');
        }
    }

    handleSlipImageUpload(event) {
        const files = event.target.files;
        const previewContainer = $('#slip-image-preview');
        previewContainer.empty(); // Clear previous preview

        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageItem = $(
                        `<div class="image-list-item">
                            <img src="${e.target.result}" class="uploaded-image-preview">
                            <button type="button" class="remove-image-btn"><i class="fas fa-times-circle"></i></button>
                        </div>`
                    );
                    previewContainer.append(imageItem);

                    imageItem.find('.remove-image-btn').on('click', function() {
                        $(this).closest('.image-list-item').remove();
                        $('#slip-image-upload').val(''); // Clear the input
                    });
                };
                reader.readAsDataURL(file);
            } else {
                showNotification('Only image files are allowed for slip upload.', 'warning');
                $('#slip-image-upload').val(''); // Clear the input
            }
        }
    }

    handleScroll() {
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollHeight - scrollPos < 200 && !this.isLoading && this.hasMore) {
            this.fetchInstallments(false, $('#dashboard-search').val().toLowerCase(), $('#dashboard-status-filter').val(), this.startDate, this.endDate);
        }
    }
}

export default PageDashboard;