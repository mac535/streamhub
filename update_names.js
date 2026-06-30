const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./client/src', function(filePath) {
  if (!filePath.endsWith('.jsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace simple {brc.name} -> {brc.location}/{brc.name}
  content = content.replace(/\{brc\.name\}/g, '{brc.location}/{brc.name}');
  
  // Replace simple {b.name} -> {b.location}/{b.name} in option tags and general
  content = content.replace(/\{b\.name\}/g, '{b.location}/{b.name}');
  
  // Replace brc.name -> brc.location + '/' + brc.name where it makes sense
  content = content.replace(/brc \? brc\.name :/g, "brc ? brc.location + '/' + brc.name :");
  
  // MessageComposer.jsx
  content = content.replace(/\$\{b\.name\}/g, '${b.location}/${b.name}');
  
  // BrcManagementPage.jsx specific
  content = content.replace(/\{brc\.name \|\| 'N\/A'\}/g, "{brc.location ? brc.location + '/' + brc.name : brc.name || 'N/A'}");
  
  // AdminDashboardPage.jsx specific issues list
  content = content.replace(/name: b\.name,/g, "name: b.location + '/' + b.name,");
  
  // Remove space in location/ name if it exists (like {b.location}/ {b.name})
  content = content.replace(/\{b\.location\}\/ \{b\.name\}/g, '{b.location}/{b.name}');
  content = content.replace(/\{brc\.location\}\/ \{brc\.name\}/g, '{brc.location}/{brc.name}');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
});
