import { debounce, openModal, closeModal, showNotification, showConfirmationModal } from '../utils/AppUtils.js';

class PageCreditCards {
    constructor() {
        this.$mainContent = $("#main-content");
        this.currentPage = 1;
        this.cardsPerPage = 10;
        this.totalCards = 0;
        this.isLoading = false;
        this.hasMore = true;
    }

    init() {
        this.fetchCreditCards(true);
        this.bindEvents();
        $(window).on("scroll", debounce(this.handleScroll.bind(this), 100));
    }

    destroy() {
        this.$mainContent.off();
        $(window).off("scroll");
    }

    bindEvents() {
        this.$mainContent.on("click", "#create-card-btn", () => openModal('add-card-modal'));
        this.$mainContent.on("click", "#add-card-modal .modal_overlay, #add-card-modal .modal_close, #cancel-add-card", () => closeModal('add-card-modal'));
        this.$mainContent.on("click", "#edit-card-modal .modal_overlay, #edit-card-modal .modal_close, #cancel-edit-card", () => closeModal('edit-card-modal'));
        this.$mainContent.on("click", "#card-details-modal .modal_overlay, #card-details-modal .modal_close", () => closeModal('card-details-modal'));
        this.$mainContent.on("click", "#confirmation-modal .modal_overlay, #confirmation-modal .modal_close, #cancel-confirmation", () => closeModal('confirmation-modal'));
        this.$mainContent.on("submit", "#add-card-form", this.handleAddCard.bind(this));
        this.$mainContent.on("submit", "#edit-card-form", this.handleUpdateCard.bind(this));
        this.$mainContent.on("click", ".btn-edit-card", this.handleEditCard.bind(this));
        this.$mainContent.on("click", ".btn-delete-card", this.handleDeleteCard.bind(this));
        this.$mainContent.on("change", "#filter-card-select", this.handleFilterChange.bind(this));
        this.$mainContent.on("input", "#card-search-input", debounce(this.handleSearchInput.bind(this), 300));
    }

    async fetchCreditCards(clearExisting = false, filter = 'all', searchTerm = '') {
        if (this.isLoading || !this.hasMore) {
            return;
        }

        this.isLoading = true;
        if (clearExisting) {
            this.showLoadingOverlay();
        } else {
            $('.infinite-scroll-loading').show();
        }

        const offset = (this.currentPage - 1) * this.cardsPerPage;
        let url = `/api/credit-cards?limit=${this.cardsPerPage}&offset=${offset}`;

        if (filter !== 'all') {
            url += `&installment_status=${filter === 'used' ? true : false}`;
        }

        if (searchTerm) {
            url += `&search=${encodeURIComponent(searchTerm)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch credit cards');
            const data = await response.json();

            this.totalCards = data.total; 
            this.hasMore = (this.currentPage * this.cardsPerPage) < this.totalCards;

            this.renderCreditCards(data.credit_cards, clearExisting);
            this.currentPage++;
        } catch (error) {
            console.error('Error fetching credit cards:', error);
            showNotification(error.message, 'error');
        } finally {
            this.isLoading = false;
            this.hideLoadingOverlay();
            $('.infinite-scroll-loading').hide();
        }
    }

    handleFilterChange() {
        this.currentPage = 1;
        this.hasMore = true;
        const filter = $('#filter-card-select').val();
        const searchTerm = $('#card-search-input').val();
        this.fetchCreditCards(true, filter, searchTerm);
    }

    handleSearchInput() {
        this.currentPage = 1;
        this.hasMore = true;
        const filter = $('#filter-card-select').val();
        const searchTerm = $('#card-search-input').val();
        this.fetchCreditCards(true, filter, searchTerm);
    }

    renderCreditCards(cards, clearExisting) {
        const cardsContainer = $('#cards-container');

        if (clearExisting) {
            cardsContainer.html('');
        }

        if (cards.length === 0 && clearExisting) {
            cardsContainer.html('<p>No credit cards found.</p>');
            return;
        } else if (cards.length === 0 && !clearExisting) {
            return;
        }

        cards.forEach(card => {
            const cardHtml = this.createCreditCard(card);
            cardsContainer.append(cardHtml);
        });
    }

    createCreditCard(card) {
        return `
            <div class="credit-card" data-card-id="${card.id}">
                <div class="credit-card_header">
                    <div class="credit-card_brand">
                        <i class="fas fa-credit-card"></i>
                        <span>${card.card_name}</span>
                    </div>
                    <div class="credit-card_actions">
                        <button class="credit-card_action btn-view-card" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="credit-card_action btn-edit-card" title="Edit Card">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="credit-card_action btn-delete-card" title="Delete Card">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="credit-card_details">
                    
                    <div class="credit-card_detail-item">
                        <span class="credit-card_detail-label">Used:</span>
                        <span class="credit-card_detail-value used">${card.used_amount}</span>
                    </div>
                    <div class="credit-card_detail-item">
                        <span class="credit-card_detail-label">Available:</span>
                        <span class="credit-card_detail-value available">${card.credit_limit - card.used_amount}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async handleAddCard(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            card_name: formData.get('cardName'),
            credit_limit: formData.get('creditLimit')
        };

        try {
            const response = await fetch('/api/credit-cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create credit card');
            }

            closeModal('add-card-modal');
            showNotification('Credit card added successfully!', 'success');
            this.currentPage = 1;
            this.hasMore = true;
            this.fetchCreditCards(true);
            form.reset();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async handleEditCard(e) {
        const cardId = $(e.currentTarget).closest("[data-card-id]").data("card-id");
        try {
            const response = await fetch(`/api/credit-cards/${cardId}`);
            if (!response.ok) throw new Error('Failed to fetch credit card data');
            const card = await response.json();

            const form = $('#edit-card-form');
            form.find('[name="id"]').val(card.id);
            form.find('[name="card_name"]').val(card.card_name);
            form.find('[name="credit_limit"]').val(card.credit_limit);

            openModal('edit-card-modal');
        } catch (error) {
            console.error('Error fetching credit card for edit:', error);
            showNotification(error.message, 'error');
        }
    }

    async handleUpdateCard(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            id: formData.get('id'),
            card_name: formData.get('card_name'),
            credit_limit: formData.get('credit_limit')
        };
        const cardId = data.id;

        try {
            const response = await fetch(`/api/credit-cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update credit card');
            }

            closeModal('edit-card-modal');
            showNotification('Credit card updated successfully!', 'success');
            this.currentPage = 1;
            this.hasMore = true;
            this.fetchCreditCards(true);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    handleDeleteCard(e) {
        const cardId = $(e.currentTarget).closest("[data-card-id]").data("card-id");
        showConfirmationModal('Are you sure you want to delete this credit card?', async () => {
            try {
                const response = await fetch(`/api/credit-cards/${cardId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete credit card');
                showNotification('Credit card deleted successfully!', 'success');
                // Remove the card element from the DOM
                $(e.currentTarget).closest("[data-card-id]").remove();
                this.currentPage = 1;
                this.hasMore = true;
                this.fetchCreditCards(true);
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    showLoadingOverlay() {
        $('.credit-cards-grid .loading-overlay').show();
    }

    hideLoadingOverlay() {
        $('.credit-cards-grid .loading-overlay').hide();
    }

    handleScroll() {
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100 && !this.isLoading && this.hasMore) {
            const filter = $('#filter-card-select').val();
            this.fetchCreditCards(false, filter);
        }
    }
}

export default PageCreditCards;
