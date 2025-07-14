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
    }

    init() {
        this.bindEvents();
        // this.fetchInstallments(true);
        this.setupCustomerModals();
    }

    setupCustomerModals() {
        // Add Customer Modal
        this.$mainContent.on("submit", "#add-customer-form", this.handleAddCustomer.bind(this));
        this.$mainContent.on("click", "#cancel-add-customer", () => closeModal('add-customer-modal'));

        // Edit Customer Modal (if applicable, though not directly used in dashboard for editing)
        // this.$mainContent.on("submit", "#edit-customer-form", this.handleEditCustomer.bind(this));
        // this.$mainContent.on("click", "#cancel-edit-customer", () => closeModal('edit-customer-modal'));
    }

    async handleAddCustomer(event) {
        event.preventDefault();
        const form = $(event.currentTarget);
        const formData = new FormData(form[0]);

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add customer');
            }
            showNotification('Customer added successfully!', 'success');
            closeModal('add-customer-modal');
            form[0].reset();
            // Optionally re-fetch customers for the modal if it's open
            if ($('#add-new-plan-modal').hasClass('modal-active')) {
                this.fetchCustomersForModal();
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            showNotification(error.message, 'error');
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

        // Customer search within modal
        this.$mainContent.on("input", "#add-new-plan-modal #customer-search-input", debounce(this.fetchCustomersForModal.bind(this), 300));

        // Customer selection within modal
        this.$mainContent.on("click", "#add-new-plan-modal .customer-option", this.handleCustomerSelection.bind(this));

        // Add new customer from dashboard modal
        this.$mainContent.on("click", "#add-customer-from-dashboard-btn", () => {
            openModal('add-customer-modal');
        });

        this.$mainContent.on("change", "#add-new-plan-modal #product-images", this.handleImageUpload.bind(this));

        // Form submission for new plan
        this.$mainContent.on("submit", "#installment-plan-form", this.handleFormSubmission.bind(this));

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
        if (this.currentStep < 5) { // Assuming 5 steps
            this.showStep(this.currentStep + 1);
        }
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

            const response = await fetch(`/api/customers?search=${search}&limit=5`); // Limit to 5 customers
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
                <div class="customer-option_status">
                    <div class="customer-selector" data-customer-id="${customer.id}">
                        <i class="fas fa-check"></i>
                    </div>
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