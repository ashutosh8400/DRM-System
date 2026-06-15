const fs = require('fs');
const path = require('path');

// Files to fix: pages need '../../utils/api' and '../../components/X'
const pageFiles = [
  'src/user/pages/BillingPage.jsx',
  'src/user/pages/ChatPage.jsx',
  'src/user/pages/DoctorDetailPage.jsx',
  'src/user/pages/DoctorPage.jsx',
  'src/user/pages/InvoiceDetailPage.jsx',
  'src/user/pages/PatientDetailPage.jsx',
  'src/user/pages/PatientPage.jsx',
  'src/user/pages/ReferralPage.jsx',
  'src/user/pages/ReportsPage.jsx',
];

// Component file that also needs fixing
const componentFiles = [
  'src/user/components/BillingForm.jsx',
];

// Fix pages: '../utils/api' -> '../../utils/api', '../components/X' -> '../components/X' (already correct for pages in user/pages -> user/components)
pageFiles.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP (not found):', filePath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Fix api import: from '../utils/api' -> from '../../utils/api'
  content = content.replace(/from '\.\.\/utils\/api'/g, "from '../../utils/api'");

  // Fix component imports: from '../components/X' -> from '../components/X'
  // Pages are at user/pages/, components are at user/components/
  // So from pages: '../components/X' is already correct path (up one from pages -> user -> components)
  // BUT the old path was '../components/X' which goes: pages -> pages/../ = user -> user/components -> CORRECT
  // So the component imports are already correct! Leave them as-is.

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('FIXED:', filePath);
  } else {
    console.log('OK (no changes):', filePath);
  }
});

// Fix component files: '../utils/api' -> '../../utils/api'
componentFiles.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP (not found):', filePath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  content = content.replace(/from '\.\.\/utils\/api'/g, "from '../../utils/api'");

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('FIXED:', filePath);
  } else {
    console.log('OK (no changes):', filePath);
  }
});

// Also fix UserDashboardPage: '../../components/X' -> '../components/X'
const dashPath = 'src/user/pages/UserDashboardPage.jsx';
const dashFull = path.resolve(dashPath);
if (fs.existsSync(dashFull)) {
  let content = fs.readFileSync(dashFull, 'utf8');
  const original = content;
  content = content.replace(/from '\.\.\/\.\.\/components\//g, "from '../components/");
  if (content !== original) {
    fs.writeFileSync(dashFull, content, 'utf8');
    console.log('FIXED:', dashPath);
  } else {
    console.log('OK:', dashPath);
  }
}

console.log('\nDone!');
