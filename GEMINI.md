## Project Overview

This project is a web-based installment system.

### Backend

*   **Language/Framework:** Node.js with Express.js
*   **Database:** PostgreSQL
*   **API Style:** RESTful API

### Frontend

*   **Language/Framework:** JavaScript (ES6) with jQuery
*   **Styling:** SCSS (Sass)
*   **Architecture:** Single-Page Application (SPA)

## Commands

All commands should be run from the `backend` directory.

*   **Install Dependencies:** `npm install`
*   **Run in Development:** `npm run dev`
*   **Run in Production:** `npm start`
*   **Run Tests:** `npm test`
*   **Compile SCSS:** `npm run scss`

## Important Files and Directories

*   `backend/src/app.js`: Main application file.
*   `backend/src/routes/`: Contains API and frontend routes.
*   `frontend/`: Contains all frontend code.
*   `frontend/js/`: Contains JavaScript files.
*   `frontend/scss/`: Contains SCSS files.
*   `frontend/public/`: Contains static assets and `index.html`.

## Coding Style and Conventions

*   **Backend:** Uses CommonJS modules (`require`/`module.exports`).
*   **Frontend:** Uses jQuery for DOM manipulation and AJAX. Global utility functions are exposed via the `window` object (`AppUtils`, `AppLoading`).
*   **API:** API routes are prefixed with `/api`.

## Structure and Stage of Customers Page (Reusable Patterns)

The Customers page (`frontend/public/pages/customers.html`) follows a common layout:
*   **Header:** `page-header` class for title, subtitle, and main actions (e.g., "Create Customer", "Toggle View").
*   **Search and Filters:** `search-section` containing a `search-bar` (input, filter button) and a collapsible `filters` panel.
*   **Content Display:** `customer-list` section which dynamically switches between a `customer-grid` (card view) and `customer-table-view` (table view). Both views include a `loading-overlay`.
*   **Modals:** Separate `div` elements with `modal` class for various interactions (Add Customer, Edit Customer, Customer Detail, Confirmation). These are typically hidden by default and controlled by JavaScript.

**JavaScript (`frontend/js/pages/customers.js`):**
*   **Module Pattern:** Uses an IIFE (`(function ($) { ... })(jQuery);`) to encapsulate page-specific logic, exposed globally as `window.PageCustomers`.
*   **`init()`:** Main entry point, calls `fetchCustomers()` and `bindEvents()`.
*   **`bindEvents()`:** Centralized event delegation using `$("#main-content").on(...)` to handle interactions within the main content area, ensuring events are bound once.
*   **Data Fetching:** Asynchronous `fetchCustomers()` function handles API calls (`/api/customers`), search, sorting, and displays loading states.
*   **Rendering:** `renderCustomers()` dynamically generates HTML for both card and table views based on fetched data. `createCustomerCard()` and `createCustomerTableRow()` are helper functions for this.
*   **View Toggling:** `toggleView()` switches between card and table layouts.
*   **Modal Interactions:** Functions like `handleAddCustomer`, `handleUpdateCustomer`, `handleDeleteCustomer`, `handleEditCustomer`, and `handleViewCustomer` manage form submissions, API calls, and modal visibility using `window.AppUtils.openModal`/`closeModal`/`showConfirmationModal`.
*   **Utility Usage:** Leverages `AppUtils.debounce` for search input and `AppUtils.showNotification` for user feedback.

**SCSS (`frontend/scss/_customers.scss`):**
*   Defines styles for `customer-grid`, `customer-card`, `customer-table-view` (including responsive adjustments), `customer-detail`, and `image-upload-container`.
*   Uses SCSS variables (e.g., `--spacing-lg`, `--color-white`) for consistent styling.

**Reusable Patterns/Adaptations for Other Pages:**
*   **Modular JavaScript:** Encapsulate page-specific JS logic within an IIFE and expose it globally.
*   **Centralized Event Binding:** Use event delegation on a main content wrapper (`#main-content`) to manage all page-specific events.
*   **Standard Page Layout:** Header, search/filter section, and content display areas.
*   **Dynamic Content Rendering:** Functions to fetch data and render HTML based on the current view (e.g., card vs. table).
*   **Modal Usage:** Consistent pattern for add/edit/detail/confirmation modals, controlled by `AppUtils` functions.
*   **Loading States:** Implement `loading-overlay` for asynchronous operations.
*   **Search and Filtering:** Standardized input and filter panel with debounce for search.
*   **Responsive Tables:** Use the provided SCSS pattern for responsive tables.
*   **Image Upload Preview:** The `image-upload-container` and associated JS for previewing images before upload.