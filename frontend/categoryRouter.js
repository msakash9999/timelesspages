/**
 * categoryRouter.js
 * Manages routing and initialization for category-specific views.
 */

(function() {
    function init() {
        // Only run on category pages
        if (document.body.dataset.bookCategory || window.location.pathname.includes('category.html')) {
            console.log("Initializing Category Page...");
            if (typeof loadCategoryPage === 'function') {
                loadCategoryPage();
            }
        }
    }

    // Wait for booksData to be available if it's being loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
