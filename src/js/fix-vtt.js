const fs = require('fs');
const path = require('path');

function fixVTTFile(filePath) {
    try {
        console.log(`🔍 Checking: ${filePath}`);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix the MPEGTS timestamp issue
        const fixedContent = content.replace(
            /X-TIMESTAMP-MAP=LOCAL:00:00:00\.000,MPEGTS:183600/g,
            'X-TIMESTAMP-MAP=LOCAL:00:00:00.000,MPEGTS:90000'
        );
        
        if (content !== fixedContent) {
            fs.writeFileSync(filePath, fixedContent, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        } else {
            console.log(`✓ No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Process all VTT files in a directory
function processDirectory(dirPath) {
    console.log(`📁 Scanning directory: ${dirPath}`);
    
    if (!fs.existsSync(dirPath)) {
        console.error(`❌ Directory does not exist: ${dirPath}`);
        return;
    }
     const files = fs.readdirSync(dirPath);
    let fixedCount = 0;
    
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
            // Recursively process subdirectories
            fixedCount += processDirectory(fullPath);
        } else if (file.endsWith('.vtt')) {
            // Process VTT files
            if (fixVTTFile(fullPath)) {
                fixedCount++;
            }
        }
    });
    
    return fixedCount;
}
function main() {
    const args = process.argv.slice(2);
    let targetDirectory = './'; // Default to current directory
    
    if (args.length > 0) {
        targetDirectory = args[0];
    }
    
    console.log('🚀 Starting VTT file fix...');
    console.log(`📂 Target directory: ${path.resolve(targetDirectory)}`);
    console.log('---');
    
    const fixedCount = processDirectory(targetDirectory);
    
    console.log('---');
    console.log(`🎉 Finished! Fixed ${fixedCount} VTT files.`);
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for use in other scripts
module.exports = { fixVTTFile, processDirectory };