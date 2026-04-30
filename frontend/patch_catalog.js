const fs = require('fs');

const path = 'c:/Users/ashis/OneDrive/Desktop/TimelessPages/frontend/catalog.js';
let content = fs.readFileSync(path, 'utf8');

// RenderArrivalCard
content = content.replace(
  /function renderArrivalCard\(book\) \{\s*const inStock = book\.inStock !== false;\s*return `\s*<a href="book\.html\?id=\$\{book\._id\}" class="arrival-card \$\{inStock \? '' : 'out-of-stock'\\}">\s*<div class="arrival-img-wrapper">\s*<img src="\$\{book\.imageUrl\}" alt="\$\{book\.title\}">\s*\$\{inStock \? '' : '<div class="out-of-stock-overlay"><span>Out of Stock<\/span><\/div>'\}\s*<\/div>\s*<h3>\$\{book\.title\}<\/h3>\s*<p class="arrival-price">\$\{formatPrice\(book\.price\)\}<\/p>\s*<\/a>\s*`;\s*\}/g,
  `function renderArrivalCard(book) {
  const stock = book.stockQuantity !== undefined ? book.stockQuantity : 10;
  const inStock = stock > 0;
  let stockMsg = '';
  if (stock <= 0) stockMsg = '<div class="out-of-stock-overlay"><span>Out of Stock</span></div>';
  else if (stock <= 2) stockMsg = '<div class="out-of-stock-overlay" style="background:rgba(231,76,60,0.8);"><span>Hurry! Almost Sold Out</span></div>';
  else if (stock <= 5) stockMsg = '<div class="out-of-stock-overlay" style="background:rgba(243,156,18,0.8);"><span>Few Items Left</span></div>';

  return \`
    <a href="book.html?id=\${book._id}" class="arrival-card \${inStock ? '' : 'out-of-stock'}">
      <div class="arrival-img-wrapper">
        <img src="\${book.imageUrl}" alt="\${book.title}">
        \${stockMsg}
      </div>
      <h3>\${book.title}</h3>
      <p class="arrival-price">\${formatPrice(book.price)}</p>
    </a>
  \`;
}`
);

// renderCompactCard
content = content.replace(
  /function renderCompactCard\(book\) \{\s*const inStock = book\.inStock !== false;\s*return `[\s\S]*?`;\s*\}/g,
  `function renderCompactCard(book) {
  const stock = book.stockQuantity !== undefined ? book.stockQuantity : 10;
  const inStock = stock > 0;
  let stockBadge = '';
  if (stock <= 0) stockBadge = '<span class="out-of-stock-badge-small">Out of Stock</span>';
  else if (stock <= 2) stockBadge = '<span class="out-of-stock-badge-small" style="background:#e74c3c;">Almost Sold Out</span>';
  else if (stock <= 5) stockBadge = '<span class="out-of-stock-badge-small" style="background:#f39c12;color:#333;">Few Left</span>';

  return \`
    <article class="product-card \${inStock ? '' : 'out-of-stock'}" data-id="\${book._id || ''}" data-title="\${encodeURIComponent(book.title || '')}" data-author="\${encodeURIComponent(book.author || '')}" data-price="\${book.price || 0}" data-img="\${encodeURIComponent(book.imageUrl || '')}" data-stock="\${stock}">
      <img src="\${book.imageUrl}" alt="\${book.title}">
      <h3>\${book.title}</h3>
      <p>\${book.description || book.author}</p>
      <strong>\${formatPrice(book.price)}</strong>
      \${stockBadge}
    </article>
  \`;
}`
);

// renderFullCard
content = content.replace(
  /function renderFullCard\(book\) \{\s*const inStock = book\.inStock !== false;\s*return `[\s\S]*?`;\s*\}/g,
  `function renderFullCard(book) {
  const stock = book.stockQuantity !== undefined ? book.stockQuantity : 10;
  const inStock = stock > 0;
  let stockMessage = '';
  if (stock <= 0) stockMessage = '<div class="out-of-stock-overlay"><span>Out of Stock</span></div>';
  else if (stock <= 2) stockMessage = '<div class="stock-alert urgent" style="position:absolute;top:10px;left:10px;background:#e74c3c;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;z-index:2;font-weight:bold;">Hurry! Almost Sold Out</div>';
  else if (stock <= 5) stockMessage = '<div class="stock-alert warning" style="position:absolute;top:10px;left:10px;background:#f39c12;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;z-index:2;font-weight:bold;">Few Items Left</div>';

  return \`
    <article class="product-card \${inStock ? '' : 'out-of-stock'}" data-id="\${book._id || ''}" data-title="\${encodeURIComponent(book.title || '')}" data-author="\${encodeURIComponent(book.author || '')}" data-price="\${book.price || 0}" data-img="\${encodeURIComponent(book.imageUrl || '')}" data-stock="\${stock}">
      <button type="button" class="wishlist-top" aria-label="Add to wishlist">&#9825;</button>
      <div class="card-img-wrapper" style="position:relative;">
        <img src="\${book.imageUrl}" alt="\${book.title}" loading="lazy">
        \${stockMessage}
      </div>
      <h3>\${book.title}</h3>
      <p class="author">\${book.author}</p>
      <div class="card-description">\${book.description || ''}</div>
      <strong>\${formatPrice(book.price)}</strong>
      <div class="storybook-actions">
        <button type="button" class="storybook-btn buy-btn" \${inStock ? '' : 'disabled'}>Buy Now</button>
        <button type="button" class="storybook-btn cart-btn" \${inStock ? '' : 'disabled'}>Add to Cart</button>
      </div>
    </article>
  \`;
}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched catalog.js');
