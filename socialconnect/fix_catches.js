const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('route.ts')) {
            results.push(file);
        }
    });
    return results;
}

const apiDir = path.join(__dirname, 'app', 'api');
const routes = walkDir(apiDir);

let changed = 0;
for (const file of routes) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace catch { with catch (err: any) { ... }
    content = content.replace(/catch\s*\{(?:\s*return\s+NextResponse\.json\(\s*\{\s*error:\s*'([^']+)'\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)\s*)?\}/g, (match, p1) => {
        const errorMsg = p1 || 'Internal server error';
        return `catch (err: any) {\n    console.error('${errorMsg} error:', err)\n    return NextResponse.json({ error: err.message || '${errorMsg}', details: err }, { status: 500 })\n  }`;
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        changed++;
        console.log('Updated:', file);
    }
}
console.log('Total files updated:', changed);
