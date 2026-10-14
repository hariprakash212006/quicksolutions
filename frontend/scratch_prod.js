const fs = require('fs');
const file = 'F:/Quick Solutions/frontend/src/pages/ProductDetail.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("import { ProductReviews } from '../components/product/ProductReviews';", "");
code = code.replace(/<'specs' \| 'desc' \| 'warranty' \| 'reviews'>/g, "<'specs' | 'desc' | 'warranty'>");
code = code.replace(/\(\['specs', 'desc', 'warranty', 'reviews'\] as const\)/g, "(['specs', 'desc', 'warranty'] as const)");
code = code.replace(/tab === 'warranty' \? 'Warranty & Service' : 'Reviews'/g, "tab === 'warranty' ? 'Warranty & Service' : ''");
code = code.replace(/\{activeTab === 'reviews' && \([\s\S]*?<ProductReviews productId=\{product\._id\} \/>[\s\S]*?\)\}/g, "");
code = code.replace(/\{activeTab === 'reviews' && <ProductReviews productId=\{product\._id\} \/>\}/g, "");

fs.writeFileSync(file, code);
