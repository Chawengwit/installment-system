import { debounce, openModal, closeModal, showNotification, showConfirmationModal } from '../utils/AppUtils.js';

class PageCustomers {
    constructor() {
        this.isCardView = true;
        this.$mainContent = $("#main-content");
        this.currentPage = 1;
        this.customersPerPage = 10;
        this.totalCustomers = 0;
        this.isLoading = false;
        this.hasMore = true;
    }

    init() {
        this.fetchCustomers(true);
        this.bindEvents();
    }

    destroy() {
        this.$mainContent.off();
        $(window).off("scroll");
    }

    bindEvents() {
        this.$mainContent.on("input", "#customer-search", debounce(this.handleSearch.bind(this), 300));
        this.$mainContent.on("change", ".filters_select", this.handleSearch.bind(this));
        this.$mainContent.on("click", "#toggle-view-btn", this.toggleView.bind(this));
        this.$mainContent.on("click", ".btn-view-customer", this.handleViewCustomer.bind(this));
        this.$mainContent.on("submit", "#add-customer-form", this.handleAddCustomer.bind(this));
        this.$mainContent.on("submit", "#edit-customer-form", this.handleUpdateCustomer.bind(this));
        this.$mainContent.on("click", ".btn-delete-customer", this.handleDeleteCustomer.bind(this));
        this.$mainContent.on("click", ".btn-edit-customer", this.handleEditCustomer.bind(this));
        this.$mainContent.on("click", ".search-bar_filter-btn", this.toggleFilters.bind(this));
        this.$mainContent.on("click", ".reset-filters-btn", this.resetFilters.bind(this));

        $(window).on("scroll", debounce(this.handleScroll.bind(this), 100));

        this.$mainContent.on("click", "#create-customer-btn", () => openModal('add-customer-modal'));
        this.$mainContent.on("click", "#add-customer-modal .modal_overlay, #add-customer-modal .modal_close, #cancel-add-customer", () => closeModal('add-customer-modal'));
        this.$mainContent.on("click", "#customer-detail-modal .modal_overlay, #customer-detail-modal .modal_close", () => closeModal('customer-detail-modal'));
        this.$mainContent.on("click", "#edit-customer-modal .modal_overlay, #edit-customer-modal .modal_close, #cancel-edit-customer", () => closeModal('edit-customer-modal'));
        this.$mainContent.on("click", "#confirmation-modal .modal_overlay, #confirmation-modal .modal_close, #cancel-confirmation", () => closeModal('confirmation-modal'));
    }

    toggleFilters() {
        $("#filters-panel").slideToggle(200);
    }

    resetFilters() {
        $("#customer-search").val('');
        $(".filters_select").eq(0).val('created_at');
        $(".filters_select").eq(1).val('DESC');
        this.currentPage = 1;
        this.hasMore = true;
        this.fetchCustomers(true);
    }

    handleSearch() {
        this.currentPage = 1;
        this.hasMore = true;
        const searchTerm = $('#customer-search').val().toLowerCase();
        const sortBy = $(".filters_select").eq(0).val();
        const sortOrder = $(".filters_select").eq(1).val();
        this.fetchCustomers(true, searchTerm, sortBy, sortOrder);
    }

    async fetchCustomers(clearExisting = false, search = '', sortBy = 'created_at', sortOrder = 'DESC') {
        if (this.isLoading || !this.hasMore) {
            return;
        }

        this.isLoading = true;
        $('#infinite-scroll-loading').show();

        const offset = (this.currentPage - 1) * this.customersPerPage;
        try {
            const response = await fetch(`/api/customers?search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${this.customersPerPage}&offset=${offset}`);
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();

            this.totalCustomers = data.totalCustomers;
            this.hasMore = (this.currentPage * this.customersPerPage) < this.totalCustomers;

            this.renderCustomers(data.customers, clearExisting);
            this.currentPage++;
        } catch (error) {
            console.error('Error fetching customers:', error);
            showNotification(error.message, 'error');
        } finally {
            this.isLoading = false;
            $('#infinite-scroll-loading').hide();
        }
    }

    renderCustomers(customers, clearExisting) {
        const customerGrid = $('#customer-grid');
        const customerTableBody = $('#customer-table-body');

        if (clearExisting) {
            customerGrid.html('');
            customerTableBody.html('');
        }

        if (customers.length === 0 && clearExisting) {
            customerGrid.html('<p>No customers found.</p>');
            customerTableBody.html('<tr><td colspan="5">No customers found.</td></tr>');
            return;
        } else if (customers.length === 0 && !clearExisting) {
            return;
        }

        customers.forEach(customer => {
            const customerCard = this.createCustomerCard(customer);
            const customerTableRow = this.createCustomerTableRow(customer);
            customerGrid.append(customerCard);
            customerTableBody.append(customerTableRow);
        });
    }

    createCustomerCard(customer) {
        return `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="customer-card_header">
                    <div class="customer-card_avatar"><i class="fas fa-user"></i></div>
                    <div class="customer-card_info">
                        <h3 class="customer-card_name">${customer.name} ${customer.nickname ? `<span class="nickname-display">(${customer.nickname})</span>` : ''}</h3>
                        <p class="customer-card_line-id">Line ID: ${customer.line_id || 'N/A'}</p>
                        <p class="customer-card_phone"><a href="tel:${customer.phone}">${customer.phone || 'N/A'}</a></p>
                    </div>
                </div>
                <div class="customer-section-details">
                    <div class="customer-section-details_item">
                        <span class="label">Active Plans:</span>
                        <span class="value">${customer.active_plans_count}</span>
                    </div>
                    <div class="customer-section-details_item">
                        <span class="label">Outstanding debt:</span>
                        <span class="value">${customer.outstanding_debt.toLocaleString()}</span>
                    </div>
                </div>
                <div class="customer-card_actions">
                    <button class="btn btn-small btn-primary btn-view-customer"><i class="fas fa-eye"></i> View</button>
                    <button class="btn btn-small btn-secondary btn-edit-customer"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-small btn-danger btn-delete-customer"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    }

    createCustomerTableRow(customer) {
        return `
            <tr data-customer-id="${customer.id}">
                <td data-label="Name">${customer.name} ${customer.nickname ? `<span class="nickname-display">(${customer.nickname})</span>` : ''}</td>
                <td data-label="Line ID">${customer.line_id || 'N/A'}</td>
                <td data-label="Phone"><a href="tel:${customer.phone}">${customer.phone || 'N/A'}</a></td>
                <td data-label="Active Plans">${customer.active_plans_count}</td>
                <td data-label="Outstanding debt">${customer.outstanding_debt.toLocaleString()}</td>
                <td data-label="Actions">
                    <button class="btn btn-small btn-primary btn-view-customer"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-small btn-secondary btn-edit-customer"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-small btn-danger btn-delete-customer"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    toggleView() {
        this.isCardView = !this.isCardView;
        const customerGrid = $('#customer-grid');
        const customerTableView = $('#customer-table-view');
        const toggleViewBtn = $('#toggle-view-btn');

        if (this.isCardView) {
            customerGrid.show();
            customerTableView.hide();
            toggleViewBtn.html('<i class="fas fa-table"></i> Table View');
        } else {
            customerGrid.hide();
            customerTableView.show();
            toggleViewBtn.html('<i class="fas fa-th-large"></i> Card View');
        }
    }

    async handleViewCustomer(e) {
        e.stopPropagation();
        const customerId = $(e.currentTarget).closest("[data-customer-id]").data("customer-id");
        try {
            const response = await fetch(`/api/customers/${customerId}`);
            if (!response.ok) throw new Error('Failed to fetch customer data');
            const customer = await response.json();

            // Populate modal with customer data
            $('#detail-customer-name').text(customer.name + (customer.nickname ? ` (${customer.nickname})` : ''));
            $('#detail-customer-phone').text(customer.phone || 'N/A');
            $('#detail-customer-address').text(customer.address || 'N/A');
            $('#detail-customer-id-card-number').text(customer.id_card_number || 'N/A');
            $('#detail-customer-line-id').text(customer.line_id || 'N/A');
            $('#detail-customer-facebook').text(customer.facebook || 'N/A');

            // Fetch and display installment history
            const installmentHistoryBody = $('#installment-history-body');
            installmentHistoryBody.empty(); // Clear previous entries

            const installmentsResponse = await fetch(`/api/customers/${customerId}/installments`);
            if (!installmentsResponse.ok) throw new Error('Failed to fetch installment history');
            const installments = await installmentsResponse.json();

            if (installments.length === 0) {
                installmentHistoryBody.append('<tr><td colspan="4">No installment history found.</td></tr>');
            } else {
                installments.forEach(installment => {
                    const progress = (installment.paid_terms / installment.term_months) * 100;
                    let statusClass = '';
                    if (installment.status === 'active') {
                        statusClass = 'badge-primary';
                    } else if (installment.status === 'completed') {
                        statusClass = 'badge-success';
                    } else if (installment.status === 'non-active') {
                        statusClass = 'badge-danger';
                    }
                    installmentHistoryBody.append(`
                        <tr>
                            <td data-label="Product">${installment.product_name}</td>
                            <td data-label="Amount"><span class="outstanding-debt-value">฿${parseFloat(installment.outstanding_debt).toLocaleString()}</span></td>
                            <td data-label="Progress">
                                <div class="progress">
                                    <div class="progress_bar" style="width: ${progress}%"></div>
                                </div>
                                <span class="progress_text">${installment.paid_terms}/${installment.term_months} payments</span>
                            </td>
                            <td data-label="Status"><span class="badge ${statusClass}">${installment.status}</span></td>
                        </tr>
                    `);
                });
            }

            openModal("customer-detail-modal");
        } catch (error) {
            console.error('Error fetching customer details:', error);
            showNotification(error.message, 'error');
        }
    }

    async handleAddCustomer(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const loadingOverlay = $('#add-customer-modal .loading-overlay');

        // Clear previous highlights
        $(form).find('input[name="phone"], input[name="id_card_number"]').removeClass('is-invalid');

        try {
            loadingOverlay.show();
            const response = await fetch('/api/customers', { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    this.highlightInvalidFields(form, errorData.error);
                }
                throw new Error(errorData.error || 'Failed to create customer');
            }
            closeModal('add-customer-modal');
            showNotification('Customer added successfully!', 'success');
            this.currentPage = 1;
            this.hasMore = true;
            this.fetchCustomers(true);
            form.reset();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            loadingOverlay.hide();
        }
    }

    async handleUpdateCustomer(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const customerId = formData.get('id');
        const loadingOverlay = $('#edit-customer-modal .loading-overlay');

        // Clear previous highlights
        $(form).find('input[name="phone"], input[name="id_card_number"]').removeClass('is-invalid');

        try {
            loadingOverlay.show();
            const response = await fetch(`/api/customers/${customerId}`, { method: 'PUT', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    this.highlightInvalidFields(form, errorData.error);
                }
                throw new Error(errorData.error || 'Failed to update customer');
            }
            closeModal('edit-customer-modal');
            showNotification('Customer updated successfully!', 'success');
            this.currentPage = 1;
            this.hasMore = true;
            this.fetchCustomers(true);
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            loadingOverlay.hide();
        }
    }

    highlightInvalidFields(form, errorMessage) {
        if (errorMessage.includes('phone')) {
            $(form).find('input[name="phone"]').addClass('is-invalid');
        }
        if (errorMessage.includes('ID card number')) {
            $(form).find('input[name="id_card_number"]').addClass('is-invalid');
        }

        // Remove highlight on input
        $(form).find('input[name="phone"], input[name="id_card_number"]').on('input', function() {
            $(this).removeClass('is-invalid');
        });
    }

    handleDeleteCustomer(e) {
        e.stopPropagation();
        const customerId = $(e.currentTarget).closest("[data-customer-id]").data("customer-id");
        showConfirmationModal('Are you sure you want to delete this customer?', async () => {
            try {
                const response = await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete customer');
                showNotification('Customer deleted successfully!', 'success');
                this.currentPage = 1;
                this.hasMore = true;
                this.fetchCustomers(true);
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    async handleEditCustomer(e) {
        e.stopPropagation();
        const customerId = $(e.currentTarget).closest("[data-customer-id]").data("customer-id");
        try {
            const response = await fetch(`/api/customers/${customerId}`);
            if (!response.ok) throw new Error('Failed to fetch customer data');
            const customer = await response.json();

            const form = $('#edit-customer-form');
            form.find('[name="id"]').val(customer.id);
            form.find('[name="name"]').val(customer.name);
            form.find('[name="phone"]').val(customer.phone);
            form.find('[name="nickname"]').val(customer.nickname);
            form.find('[name="line_id"]').val(customer.line_id);
            form.find('[name="facebook"]').val(customer.facebook);
            form.find('[name="id_card_number"]').val(customer.id_card_number);
            form.find('[name="address"]').val(customer.address);

            const preview = form.find('.id-card-preview');
            const noImagePlaceholder = form.find('.no-image-placeholder');
            const imageNotFoundPlaceholder = form.find('.image-not-found-placeholder');

            if (customer.id_card_image) {
                preview.attr('src', customer.id_card_image).show();
                noImagePlaceholder.hide();
                imageNotFoundPlaceholder.hide();
            } else {
                preview.hide();
                noImagePlaceholder.show();
                imageNotFoundPlaceholder.hide();
            }

            const fileInput = form.find('#edit-idCard-input');
            fileInput.off('change').on('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.attr('src', e.target.result).show();
                        noImagePlaceholder.hide();
                        imageNotFoundPlaceholder.hide();
                    };
                    reader.readAsDataURL(file);
                }
            });

            openModal('edit-customer-modal');
        } catch (error) {
            console.error('Error fetching customer for edit:', error);
            showNotification(error.message, 'error');
        }
    }

    handleScroll() {
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollHeight - scrollPos < 200 && !this.isLoading && this.hasMore) {
            this.fetchCustomers(false, $('#customer-search').val().toLowerCase(), $(".filters_select").eq(0).val(), $(".filters_select").eq(1).val());
        }
    }
}

export default PageCustomers;