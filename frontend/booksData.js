/**
 * booksData.js
 * Centralized data file containing 50+ books per category.
 */

const categories = [
    "Fiction", "Non-Fiction", "Mystery", "Thriller", "Romance", 
    "Biography", "Self Help", "Business", "Finance", "Programming", 
    "Technology", "Science", "Medical", "Engineering", "Law", 
    "History", "Religion", "Philosophy", "Psychology", "Children", 
    "Comics", "Manga", "Horror", "Fantasy", "Literature", 
    "UPSC / Government Exams", "SSC / Banking", "School Books", 
    "College Books", "Competitive Exams"
];

const authors = [
    "J.K. Rowling", "George R.R. Martin", "James Clear", "Robert Kiyosaki", 
    "Stephen King", "Agatha Christie", "Dan Brown", "Yuval Noah Harari",
    "Malcolm Gladwell", "Dale Carnegie", "Simon Sinek", "Adam Grant",
    "Martin Fowler", "Uncle Bob", "Linus Torvalds", "Steve Jobs",
    "Elon Musk", "Bill Gates", "Mark Manson", "Jordan Peterson",
    "F. Scott Fitzgerald", "Ernest Hemingway", "Jane Austen", "Charles Dickens"
];

const titleParts = [
    "The Art of", "Mastering", "Beginner's Guide to", "The Secrets of",
    "Journey through", "The Future of", "History of", "Understanding",
    "The Mystery of", "Adventures in", "The Science of", "Psychology of",
    "Laws of", "Power of", "Life of", "Legacy of", "Essentials of", "Advanced"
];

const booksData = [];

let bookIdCounter = 1;

categories.forEach(cat => {
    // Adding 52 books per category to satisfy "50+ books per category"
    for (let i = 1; i <= 52; i++) {
        const id = `book${String(bookIdCounter).padStart(4, '0')}`;
        const title = `${titleParts[Math.floor(Math.random() * titleParts.length)]} ${cat} Vol. ${i}`;
        const author = authors[Math.floor(Math.random() * authors.length)];
        const price = 400 + Math.floor(Math.random() * 1000);
        const discountPrice = price - Math.floor(Math.random() * 200);
        const stock = Math.floor(Math.random() * 15);
        const rating = (4 + Math.random() * 0.9).toFixed(1);
        
        booksData.push({
            id: id,
            title: title,
            author: author,
            category: cat,
            price: price,
            discountPrice: discountPrice,
            stock: stock,
            rating: parseFloat(rating),
            image: `https://picsum.photos/seed/${id}/300/400`,
            description: `An insightful book about ${cat}. This volume ${i} explores various foundational concepts and advanced theories in the field of ${cat}.`
        });
        bookIdCounter++;
    }
});

// For browser environment
if (typeof window !== 'undefined') {
    window.booksData = booksData;
}

// For node environment
if (typeof module !== 'undefined') {
    module.exports = booksData;
}
