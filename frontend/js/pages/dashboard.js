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
    }

    init() {
        this.bindEvents();
        this.fetchInstallments(true);
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
        this.$mainContent.on("click", ".modal_close", () => closeModal('add-new-plan-modal'));
        this.$mainContent.on("input", "#dashboard-search", debounce(this.handleSearch.bind(this), 300));
        this.$mainContent.on("change", "#dashboard-status-filter", this.handleSearch.bind(this));
        this.$mainContent.on("click", "#toggle-view-btn", this.toggleView.bind(this));

        // Multi-step form navigation
        this.$mainContent.on("click", "#add-new-plan-modal .btn[data-action='next']", this.nextStep.bind(this));
        this.$mainContent.on("click", "#add-new-plan-modal .btn[data-action='prev']", this.prevStep.bind(this));

        // File upload event
        this.$mainContent.on("click", "#add-new-plan-modal .file-upload_area", function() {
            $(this).siblings('.file-upload_input').trigger('click');
        });
        this.$mainContent.on("change", "#add-new-plan-modal #product-images", this.handleImageUpload.bind(this));

        $(window).on("scroll", debounce(this.handleScroll.bind(this), 100));
    }

    handleImageUpload(event) {
        const files = event.target.files;
        const previewContainer = $('#product-image-list');

        Array.from(files).forEach(file => {
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

    showStep(stepNumber) {
        this.currentStep = stepNumber;
        $('#add-new-plan-modal .form-step').removeClass('form-step-active');
        $('#add-new-plan-modal #step-' + stepNumber).addClass('form-step-active');

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

    handleSearch() {
        this.currentPage = 1;
        this.hasMore = true;
        const searchTerm = $('#dashboard-search').val().toLowerCase();
        const status = $('#dashboard-status-filter').val();
        this.fetchInstallments(true, searchTerm, status);
    }

    async fetchInstallments(clearExisting = false, search = '', status = 'all') {
        if (this.isLoading || !this.hasMore) {
            return;
        }

        this.isLoading = true;
        $('#infinite-scroll-loading').show();

        const offset = (this.currentPage - 1) * this.installmentsPerPage;
        try {
            // This will need to be implemented in the backend
            const response = await fetch(`/api/installments?search=${search}&status=${status}&limit=${this.installmentsPerPage}&offset=${offset}`);
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
            this.fetchInstallments(false, $('#dashboard-search').val().toLowerCase(), $('#dashboard-status-filter').val());
        }
    }
}

export default PageDashboard;