require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./models/Book");

// Original books from seedData.js
const originalBooks = [
  { title: "Origin of Species", author: "Charles Darwin", price: 349, category: "science", imageUrl: "https://covers.openlibrary.org/b/isbn/9780140432053-M.jpg", description: "Classic Edition", featured: true },
  { title: "The Blind Watchmaker", author: "Richard Dawkins", price: 329, category: "science", imageUrl: "https://covers.openlibrary.org/b/isbn/9780393315707-M.jpg", description: "Science Collection", featured: true },
  { title: "Clean Code", author: "Robert C. Martin", price: 549, category: "bca", imageUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg", description: "A Handbook of Agile Software Craftsmanship" },
  { title: "Introduction to Algorithms", author: "Cormen, Leiserson", price: 799, category: "bca", imageUrl: "https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg", description: "The standard textbook for algorithms." },
  { title: "Principles of Marketing", author: "Philip Kotler", price: 699, category: "bba", imageUrl: "https://covers.openlibrary.org/b/isbn/9780132555906-M.jpg", description: "The bible of marketing." },
  { title: "Management", author: "Stephen P. Robbins", price: 599, category: "bba", imageUrl: "https://covers.openlibrary.org/b/isbn/9780073530680-M.jpg", description: "Comprehensive management fundamentals." },
  { title: "Financial Accounting", author: "T.S. Grewal", price: 429, category: "bcom", imageUrl: "https://covers.openlibrary.org/b/isbn/9780070263857-M.jpg", description: "Essentials of commerce accounting." },
  { title: "Business Law", author: "N.D. Kapoor", price: 449, category: "bcom", imageUrl: "https://covers.openlibrary.org/b/isbn/9789352039098-M.jpg", description: "Mercantile law and practices." },
  { title: "Mass Communication Theory", author: "Denis McQuail", price: 599, category: "bajmc", imageUrl: "https://covers.openlibrary.org/b/isbn/9780205029044-M.jpg", description: "Foundations of journalism." },
  { title: "Public Relations: Strategies", author: "Dennis Wilcox", price: 529, category: "bajmc", imageUrl: "https://covers.openlibrary.org/b/isbn/9780205956159-M.jpg", description: "Strategic media relations." },
  { title: "International Business", author: "Charles W.L. Hill", price: 649, category: "bbib", imageUrl: "https://covers.openlibrary.org/b/isbn/9780078029240-M.jpg", description: "Global trade and commerce logic." },
  { title: "International Economics", author: "Paul Krugman", price: 699, category: "bbib", imageUrl: "https://covers.openlibrary.org/b/isbn/9780132555586-M.jpg", description: "Theory and policy of global economies." },
  { title: "Fundamentals of Physics", author: "Halliday, Resnick", price: 749, category: "bsc", imageUrl: "https://covers.openlibrary.org/b/isbn/9780471472445-M.jpg", description: "Comprehensive physics for undergrads." },
  { title: "Organic Chemistry", author: "Morrison & Boyd", price: 599, category: "bsc", imageUrl: "https://covers.openlibrary.org/b/isbn/9780321750907-M.jpg", description: "Advanced chemical structures." }
];

// Expanded books from seedAllBooks.js (the generated ones)
const expandedBooks = [
  // (I'll keep a sample and then generate the rest like I did before, 
  // but better to just use the 142 I already had in seedAllBooks.js)
];

// I'll read seedAllBooks.js again to get the full list of generated books
// Wait, I can just append the originalBooks to the list in seedAllBooks.js.

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear all existing books first
  await Book.deleteMany({});
  console.log("Cleared existing books");

  // Get books from seedAllBooks.js (I'll just require it if possible, or read it)
  // Actually, I'll just write a script that merges them.
}
