## Project Overview

This project is a web-based installment system.

### Backend

*   **Language/Framework:** Node.js with Express.js
*   **Module System:** ES Modules (`import`/`export`)
*   **Database:** PostgreSQL
*   **API Style:** RESTful API

### Frontend

*   **Language/Framework:** JavaScript (ES6) with jQuery
*   **Module System:** ES Modules (`import`/`export`)
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
*   `frontend/js/utils/`: Contains shared utility ES Modules.
*   `frontend/scss/`: Contains SCSS files.
*   `frontend/public/`: Contains static assets and `index.html`.

## Coding Style and Conventions

*   **Backend:** Uses ES Modules (`import`/`export`).
*   **Frontend:** Uses jQuery for DOM manipulation and AJAX. JavaScript is structured using ES Module classes for page-specific logic and utility functions.
*   **API:** API routes are prefixed with `/api`.

## Reusable Page Structure and Patterns

The Customers page (`frontend/public/pages/customers.html`) serves as a template for other pages, demonstrating a consistent structure and set of reusable patterns:

### HTML Structure
*   **Header:** `page-header` class for title, subtitle, and main actions (e.g., "Create Customer", "Toggle View").
*   **Search and Filters:** `search-section` containing a `search-bar` (input, filter button) and a collapsible `filters` panel.
*   **Content Display:** A section (e.g., `customer-list`) which dynamically switches between different views (e.g., `customer-grid` for card view, `customer-table-view` for table view). Both views typically include a `loading-overlay`.
*   **Modals:** Separate `div` elements with `modal` class for various interactions (e.g., Add, Edit, Detail, Confirmation). These are typically hidden by default and controlled by JavaScript.

### JavaScript Patterns (ES Modules)
Page-specific JavaScript (e.g., `frontend/js/pages/customers.js`) is structured as an ES Module exporting a class, following these conventions:
*   **ES Module Class:** Logic is encapsulated within a class (e.g., `PageCustomers`), exported as the default.
*   **`constructor()`:** Initializes properties like `$mainContent` (the page's main content wrapper).
*   **`init()`:** The main entry point for the page, responsible for initial data fetching and binding event listeners.
*   **`destroy()`:** A method to clean up event listeners and resources when navigating away from the page, preventing memory leaks.
*   **`bindEvents()`:** Centralized event delegation using `$("#main-content").on(...)` to handle interactions within the main content area. This ensures events are bound once and are effective for dynamically added content.
*   **Data Fetching:** Asynchronous methods (e.g., `fetchCustomers()`) handle API calls, search, sorting, and display loading states.
*   **Rendering:** Methods like `renderCustomers()` dynamically generate HTML based on fetched data. Helper methods (e.g., `createCustomerCard()`, `createCustomerTableRow()`) are used for individual element creation.
*   **View Toggling:** Functions to switch between different content layouts (e.g., card vs. table views).
*   **Modal Interactions:** Methods (e.g., `handleAddCustomer`, `handleUpdateCustomer`, `handleDeleteCustomer`, `handleEditCustomer`, `handleViewCustomer`) manage form submissions, API calls, and modal visibility using imported utility functions (e.g., `openModal`, `closeModal`, `showConfirmationModal`).
*   **Utility Usage:** Leverages imported utility functions from `frontend/js/utils/AppUtils.js` (e.g., `debounce` for search input, `showNotification` for user feedback).

### SCSS Patterns
Page-specific SCSS (e.g., `frontend/scss/_customers.scss`) defines styles for the page's unique components (e.g., `customer-grid`, `customer-card`, `customer-table-view`). It uses SCSS variables for consistent styling and includes responsive adjustments.

### General Reusability Guidelines
When creating new pages or refactoring existing ones, adapt the following patterns:
*   **Modular JavaScript (ES Modules):** Always encapsulate page-specific JS logic within an ES Module class and export it as the default.
*   **Centralized Event Binding:** Use event delegation on the main content wrapper (`#main-content`) for all page-specific events.
*   **Standard Page Layout:** Adhere to the header, search/filter, and content display sections.
*   **Dynamic Content Rendering:** Implement functions to fetch data and render HTML based on the current view.
*   **Modal Usage:** Follow the consistent pattern for add/edit/detail/confirmation modals, controlled by imported `AppUtils` functions.
*   **Loading States:** Implement `loading-overlay` for asynchronous operations.
*   **Search and Filtering:** Use the standardized input and filter panel with `debounce` for search.
*   **Responsive Tables:** Apply the provided SCSS pattern for responsive tables.
*   **Image Upload Preview:** Utilize the `image-upload-container` and associated JS for previewing images before upload where applicable.
*   **Utility Modules:** Import common utility functions from `frontend/js/utils/AppUtils.js` instead of creating global functions.
*   **Utility Modules:** Common utility functions are now in `frontend/js/utils/AppUtils.js` and imported where needed.
