// DEPRECATED: This script is no longer needed as the project has been migrated to React Query and centralized Axios client
// The new architecture uses:
// - Centralized axiosClient (src/config/axiosClient.js)
// - Service layer (src/services/)
// - React Query hooks (src/hooks/)

const fs = require('fs');
const path = require('path');

// Recursive function to find all JS files
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') && !file.includes('fix-api-calls')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix API calls in a file
function fixAPICallsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file already imports apiCall
  const hasApiCallImport = content.includes("import { apiCall }");
  
  // Find fetch calls with relative API paths
  const fetchRegex = /fetch\s*\(\s*['"`]\/api\/([^'"`)]+)['"`]/g;
  const matches = content.match(fetchRegex);
  
  if (matches && matches.length > 0) {
    console.log(`Fixing ${matches.length} API calls in: ${filePath}`);
    
    // Add import if not present
    if (!hasApiCallImport) {
      // Find the last import statement
      const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        
        // Calculate relative path to config/api.js
        const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'config', 'api.js'));
        const importPath = relativePath.replace(/\\/g, '/').replace(/^\.\.\//, '../');
        
        content = content.slice(0, insertIndex) + 
                 `\nimport { apiCall } from '${importPath.startsWith('.') ? importPath : './' + importPath}';` + 
                 content.slice(insertIndex);
        modified = true;
      }
    }
    
    // Replace fetch calls with apiCall
    content = content.replace(
      /fetch\s*\(\s*['"`]\/api\/([^'"`)]+)['"`]\s*,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{localStorage\.getItem\(['"]token['"]\)\}`\s*\}\s*\}/g,
      "apiCall('/api/$1')"
    );
    
    // Replace other fetch patterns
    content = content.replace(
      /fetch\s*\(\s*['"`]\/api\/([^'"`)]+)['"`]/g,
      "apiCall('/api/$1'"
    );
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const jsFiles = findJSFiles(srcDir);

console.log(`Found ${jsFiles.length} JS files to check...`);

jsFiles.forEach(filePath => {
  try {
    fixAPICallsInFile(filePath);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('API call fixing completed!');