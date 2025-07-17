import { debounce, openModal, closeModal, showNotification } from '../utils/AppUtils.js';

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
    }

    init() {
        this.bindEvents();
        // this.fetchInstallments(true);
        this.setupCustomerModals();
        this.setupCreditCardModals();
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
                    card_number: cardNumber,
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
        const phoneInput = form.find('[name="phone"]');
        const idCardNumberInput = form.find('[name="id_card_number"]');

        // Clear previous errors
        form.find('.form_input').removeClass('form_input-error');

        const name = nameInput.val();
        const phone = phoneInput.val();
        const idCardNumber = idCardNumberInput.val();

        if (!name || !phone || !idCardNumber) {
            if (!name) nameInput.addClass('form_input-error');
            if (!phone) phoneInput.addClass('form_input-error');
            if (!idCardNumber) idCardNumberInput.addClass('form_input-error');
            showNotification('Name, phone, and ID card number are required.', 'error');
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
                    phoneInput.addClass('form_input-error');
                    idCardNumberInput.addClass('form_input-error');
                } else if (response.status === 400) { // Validation error from backend
                    nameInput.addClass('form_input-error');
                    phoneInput.addClass('form_input-error');
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
            openModal('add-new-plan-modal');
            this.showStep(1); // Show first step when modal opens
        });
        this.$mainContent.on("click", ".modal_close", (event) => {
            const modalId = $(event.currentTarget).closest('.modal').attr('id');
            closeModal(modalId);
        });
        this.$mainContent.on("input", "#dashboard-search", debounce(this.handleSearch.bind(this), 300));
        this.$mainContent.on("change", "#dashboard-status-filter", this.handleSearch.bind(this));
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

        this.$mainContent.on("click", "#customize-term-btn", () => this.showStep(2));

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

    

    clearAddPlanForm() {
        $('#installment-plan-form')[0].reset();
        $('#product-image-list').empty();
        $('#add-new-plan-modal .customer-option').removeClass('customer-option-selected');
        this.selectedCustomerId = null;
        this.showStep(1);
    }

    async handleFormSubmission(event) {
        event.preventDefault();
        // TODO: Implement form submission logic for the new installment plan
        showNotification('Installment plan submitted (placeholder)!', 'success');
        closeModal('add-new-plan-modal');
        this.clearAddPlanForm();
    }

    showStep(stepNumber) {
        this.currentStep = stepNumber;
        $('#add-new-plan-modal .form-step').removeClass('form-step-active');
        $('#add-new-plan-modal #step-' + stepNumber).addClass('form-step-active');

        if (stepNumber === 3) {
            this.fetchCustomersForModal();
        } else if (stepNumber === 4) {
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
            if (this.currentStep < 5) { // Assuming 5 steps
                this.showStep(this.currentStep + 1);
            }
        }
    }

    copySummaryToClipboard() {
        const summaryText = [
            `Product Price: ${$('#summary-price').text()}`,
            `Down Payment: ${$('#summary-down-payment').text()}`,
            `Financed Amount: ${$('#summary-financed').text()}`,
            `Interest Rate: ${$('#summary-interest-rate').text()}`,
            `Interest Amount: ${$('#summary-interest-amount').text()}`,
            `Total Amount: ${$('#summary-total').text()}`,
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
                const productSerialNumber = currentStepElement.find('#product-serial-number').val();
                const productPrice = currentStepElement.find('#product-price').val();

                if (!productName) {
                    currentStepElement.find('#product-name').addClass('form_input-error');
                    isValid = false;
                }
                if (!productSerialNumber) {
                    currentStepElement.find('#product-serial-number').addClass('form_input-error');
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
                    console.log(">> Show Error <<");

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
        const productPrice = form.find('#product-price').val();
        const installmentMonths = form.find('#installment-months').val();
        const interestRate = form.find('#interest-rate').val();
        const paymentDueDate = form.find('#payment-due-date').val();
        const customerName = $('#add-new-plan-modal .customer-option-selected .customer-option_name').text();
        const customerPhone = $('#add-new-plan-modal .customer-option-selected .customer-option_details').text().split('•')[0].trim();
        const cardName = $('#add-new-plan-modal .card-option-selected .card-option_name').text();

        const monthlyPayment = ((parseFloat(productPrice) * (1 + parseFloat(interestRate) / 100)) / parseInt(installmentMonths, 10)).toFixed(2);

        $('#review-customer').text(`${customerName} - ${customerPhone}`);
        $('#review-product').text(`${productName} - ฿${productPrice}`);
        $('#review-payment-method').text(`Credit Card - ${cardName}`);
        $('#review-terms').text(`${installmentMonths} months - ฿${monthlyPayment}/month`);
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
            // If a customer is already selected, fetch their details and add them to the top
            if (this.selectedCustomerId) {
                const selectedCustomerResponse = await fetch(`/api/customers/${this.selectedCustomerId}`);
                if (!selectedCustomerResponse.ok) throw new Error('Failed to fetch selected customer details');
                const selectedCustomer = await selectedCustomerResponse.json();
                if (selectedCustomer) {
                    customers.push(selectedCustomer);
                }
            }

            const response = await fetch(`/api/customers?search=${search}&limit=5&sortBy=created_at&sortOrder=DESC`); // Limit to 5 customers
            if (!response.ok) throw new Error('Failed to fetch customers for modal');
            const data = await response.json();

            // Filter out the already selected customer from the search results to avoid duplication
            const filteredCustomers = data.customers.filter(customer => customer.id !== this.selectedCustomerId);
            customers = customers.concat(filteredCustomers);

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
        return `
            <div class="customer-option ${selectedClass}" data-customer-id="${customer.id}">
                <div class="customer-option_avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="customer-option_info">
                    <h4 class="customer-option_name">${customer.name}</h4>
                    <p class="customer-option_details">${customer.phone} • ${customer.activePlans || 0} active plans</p>
                </div>
            </div>
        `;
    }

    async fetchCreditCardsForModal(event) {
        const search = event ? $(event.target).val().toLowerCase() : '';
        const cardOptionsContainer = $('#add-new-plan-modal .card-selection');
        cardOptionsContainer.html('<p>Loading credit cards...</p>');

        try {
            let cards = [];
            if (this.selectedCreditCardId) {
                const selectedCardResponse = await fetch(`/api/credit-cards/${this.selectedCreditCardId}`);
                if (!selectedCardResponse.ok) throw new Error('Failed to fetch selected credit card details');
                const selectedCard = await selectedCardResponse.json();
                if (selectedCard) {
                    cards.push(selectedCard);
                }
            }

            const response = await fetch(`/api/credit-cards?search=${search}&limit=5`);
            if (!response.ok) throw new Error('Failed to fetch credit cards for modal');
            const data = await response.json();

            const filteredCards = data.credit_cards.filter(card => card.id !== this.selectedCreditCardId);
            cards = cards.concat(filteredCards);

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
                    <span class="card-option_number">**** **** **** ${String(card.card_number).slice(-4)}</span>
                </div>
                <div class="card-option_limit">
                    <span class="card-option_available"><span class="card-available-amount">${(card.credit_limit - card.used_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> <span class="card-available-text">available</span></span>
                </div>
            </div>
        `;
    }

    handleSearch() {
        this.currentPage = 1;
        this.hasMore = true;
        const searchTerm = $('#dashboard-search').val().toLowerCase();
        const status = $('#dashboard-status-filter').val();
        // this.fetchInstallments(true, searchTerm, status);
    }

    // async fetchInstallments(clearExisting = false, search = '', status = 'all') {
    //     if (this.isLoading || !this.hasMore) {
    //         return;
    //     }

    //     this.isLoading = true;
    //     $('#infinite-scroll-loading').show();

    //     const offset = (this.currentPage - 1) * this.installmentsPerPage;
    //     try {
    //         // This will need to be implemented in the backend
    //         const response = await fetch(`/api/installments?search=${search}&status=${status}&limit=${this.installmentsPerPage}&offset=${offset}`);
    //         if (!response.ok) throw new Error('Failed to fetch installment plans');
    //         const data = await response.json();

    //         this.totalInstallments = data.totalInstallments;
    //         this.hasMore = (this.currentPage * this.installmentsPerPage) < this.totalInstallments;

    //         this.renderInstallments(data.installments, clearExisting);
    //         this.currentPage++;
    //     } catch (error) {
    //         console.error('Error fetching installment plans:', error);
    //         showNotification(error.message, 'error');
    //     } finally {
    //         this.isLoading = false;
    //         $('#infinite-scroll-loading').hide();
    //     }
    // }

    renderInstallments(installments, clearExisting) {
        const installmentGrid = $('#installments-grid');
        const installmentTableBody = $('#installment-table-body');

        if (clearExisting) {
            installmentGrid.html('');
            installmentTableBody.html('');
        }

        if (installments.length === 0 && clearExisting) {
            installmentGrid.html('<p>No installment plans found.</p>');
            installmentTableBody.html('<tr><td colspan="5">No installment plans found.</td></tr>');
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
        // Table row template to be filled
        return `
            <tr data-installment-id="${installment.id}">
                
            </tr>
        `;
    }

    toggleView() {
        this.isCardView = !this.isCardView;
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

    handleScroll() {
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollHeight - scrollPos < 200 && !this.isLoading && this.hasMore) {
            // this.fetchInstallments(false, $('#dashboard-search').val().toLowerCase(), $('#dashboard-status-filter').val());
        }
    }
}

export default PageDashboard;