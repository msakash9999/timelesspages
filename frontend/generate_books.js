const categories = [
    "Fiction", "Non-Fiction", "Mystery", "Thriller", "Romance", 
    "Biography", "Self Help", "Business", "Finance", "Programming", 
    "Technology", "Science", "Medical", "Engineering", "Law", 
    "History", "Religion", "Philosophy", "Psychology", "Children", 
    "Comics", "Manga", "Horror", "Fantasy", "Literature", 
    "UPSC / Government Exams", "SSC / Banking", "School Books", 
    "College Books", "Competitive Exams"
];

const books = [];

const authors = [
    "J.K. Rowling", "George R.R. Martin", "James Clear", "Robert Kiyosaki", 
    "Stephen King", "Agatha Christie", "Dan Brown", "Yuval Noah Harari",
    "Malcolm Gladwell", "Dale Carnegie", "Simon Sinek", "Adam Grant",
    "Martin Fowler", "Uncle Bob", "Linus Torvalds", "Steve Jobs",
    "Elon Musk", "Bill Gates", "Mark Manson", "Jordan Peterson"
];

const titleParts = [
    "The Art of", "Mastering", "Beginner's Guide to", "The Secrets of",
    "Journey through", "The Future of", "History of", "Understanding",
    "The Mystery of", "Adventures in", "The Science of", "Psychology of",
    "Laws of", "Power of", "Life of", "Legacy of"
];

let bookIdCounter = 1;

categories.forEach(cat => {
    for (let i = 1; i <= 55; i++) {
        const id = `book${String(bookIdCounter).padStart(4, '0')}`;
        const title = `${titleParts[Math.floor(Math.random() * titleParts.length)]} ${cat} Vol. ${i}`;
        const author = authors[Math.floor(Math.random() * authors.length)];
        const price = 400 + Math.floor(Math.random() * 1000);
        const discountPrice = price - Math.floor(Math.random() * 200);
        const stock = Math.floor(Math.random() * 20);
        const rating = (4 + Math.random()).toFixed(1);
        const catPath = cat.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        books.push({
            id: id,
            title: title,
            author: author,
            category: cat,
            price: price,
            discountPrice: discountPrice,
            stock: stock,
            rating: parseFloat(rating),
            image: `https://picsum.photos/seed/${id}/300/400`, // Using dynamic images for now
            description: `An insightful book about ${cat}. This volume explores various aspects and provides deep knowledge for enthusiasts and professionals alike.`
        });
        bookIdCounter++;
    }
});

const content = `const booksData = ${JSON.stringify(books, null, 2)};\n\nif (typeof module !== 'undefined') module.exports = booksData;`;

require('fs').writeFileSync('booksData.js', content);
console.log('booksData.js created with ' + books.length + ' books.');
