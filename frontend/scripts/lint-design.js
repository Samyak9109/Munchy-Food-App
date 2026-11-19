import fs from 'fs';
import path from 'path';
import process from 'node:process';

const SRC_DIR = path.resolve(process.cwd(), 'src');

let errors = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else {
      checkFile(full);
    }
  }
}

function checkFile(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check: No native alert() or confirm() in app components
  if (/\.(jsx?|tsx?)$/.test(filePath)) {
    if (filePath.endsWith('ConfirmSheet.jsx') || filePath.endsWith('toastStore.js')) {
      return;
    }
    const alertMatch = content.match(/\b(alert|confirm)\s*\(/g);
    if (alertMatch) {
      console.error(`❌ [LINT-DESIGN] Found native dialog in ${rel}: ${alertMatch.join(', ')}`);
      errors++;
    }
  }
}

walk(SRC_DIR);

if (errors > 0) {
  console.error(`Found ${errors} design system violations.`);
  process.exit(1);
} else {
  console.log('✅ Design system lint passed: 0 native dialog violations.');
}
