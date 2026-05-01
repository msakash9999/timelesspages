/**
 * categoryLoader.js
 * Handles fetching books by category and initializing the category page.
 */

function getBooksByCategory(category) {
    if (typeof booksData === 'undefined') return [];
    
    if (!category || category.toLowerCase() === 'all') {
        return booksData;
    }

    return booksData.filter(book => 
        book.category.toLowerCase() === category.toLowerCase()
    );
}

function sortBooks(books, option) {
    const sorted = [...books];
    switch (option) {
        case 'price-low':
            return sorted.sort((a, b) => a.discountPrice - b.discountPrice);
        case 'price-high':
            return sorted.sort((a, b) => b.discountPrice - a.discountPrice);
        case 'rating':
            return sorted.sort((a, b) => b.rating - a.rating);
        case 'bestseller':
            return sorted.sort((a, b) => b.stock - a.stock); // Mocking bestseller by stock for now
        case 'newest':
            return sorted; // Assuming original order is newest
        default:
            return sorted;
    }
}

function loadCategoryPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('type') || document.body.dataset.bookCategory;
    const sortBy = document.getElementById('sort-select')?.value || 'newest';
    const searchQuery = document.getElementById('category-search')?.value?.toLowerCase() || '';

    if (!category) return;

    // Update UI
    const titleElement = document.querySelector('.hero-copy h1');
    if (titleElement) titleElement.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Collection`;

    let books = getBooksByCategory(category);

    // Apply search
    if (searchQuery) {
        books = books.filter(book => 
            book.title.toLowerCase().includes(searchQuery) || 
            book.author.toLowerCase().includes(searchQuery)
        );
    }

    // Apply Sort
    books = sortBooks(books, sortBy);

    // Pagination (Simple version)
    const itemsPerPage = 12;
    const page = parseInt(urlParams.get('page')) || 1;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedBooks = books.slice(startIndex, startIndex + itemsPerPage);

    renderCategoryBooks(paginatedBooks);
    renderPagination(books.length, itemsPerPage, page);
}

function renderPagination(totalItems, itemsPerPage, currentPage) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
    loadCategoryPage();
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('sort-select')) {
        document.getElementById('sort-select').addEventListener('change', loadCategoryPage);
    }
    if (document.getElementById('category-search')) {
        document.getElementById('category-search').addEventListener('input', loadCategoryPage);
    }
});
