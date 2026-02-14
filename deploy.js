const fs = require('fs-extra');
const path = require('path');

// --- CONFIGURATION ---
const srcDir = path.join(__dirname, 'dist\\game-night-assistant-ng\\browser');
const destDir = path.join('J:\\game-night-assistant\\public');

async function deploy() {
    try {
        // 1. Ensure destination exists and is empty
        console.log('Cleaning destination folder...');
        await fs.emptyDir(destDir);

        // 2. Read files from the build folder
        const files = await fs.readdir(srcDir);

        // 3. Filter for index, styles, and any main/runtime/polyfills JS files
        // We use startsWith because Angular adds hashes (e.g., main.8h2j.js)
        const targets = files.filter(file => 
            file === 'index.html' || 
            file.startsWith('main') || 
            file.startsWith('styles') ||
            file.startsWith('runtime') ||
            file.startsWith('polyfills')
        );

        // 4. Copy the files
        for (const file of targets) {
            await fs.copy(path.join(srcDir, file), path.join(destDir, file));
            console.log(`Successfully copied: ${file}`);
        }

        console.log('\nDeployment sync complete! ✨');
    } catch (err) {
        console.error('Deployment failed:', err);
        process.exit(1);
    }
}

deploy();