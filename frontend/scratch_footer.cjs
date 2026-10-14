const fs = require('fs');
const file = 'F:/Quick Solutions/frontend/src/components/layout/Footer.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("['/faq', 'Frequently Asked Questions'],", "['/faq', 'Frequently Asked Questions'],\n                ['/feedback', 'Customer Feedback'],");

fs.writeFileSync(file, code);
