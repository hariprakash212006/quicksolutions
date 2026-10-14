const fs = require('fs');
const file = 'F:/Quick Solutions/frontend/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("import { NotFound } from './pages/NotFound';", "import { NotFound } from './pages/NotFound';\nimport { Feedback } from './pages/Feedback';");
code = code.replace("<Route path=\"/faq\" element={<FAQ />} />", "<Route path=\"/faq\" element={<FAQ />} />\n                    <Route path=\"/feedback\" element={<Feedback />} />");

fs.writeFileSync(file, code);
