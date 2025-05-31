// Script to replace standard useGameBroadcast with improved version
const fs = require('fs');
const path = require('path');

const sourceFile = path.resolve(__dirname, 'src/hooks/useGameBroadcast.improved.ts');
const destFile = path.resolve(__dirname, 'src/hooks/useGameBroadcast.ts');

// Create backup of original file
const backupFile = path.resolve(__dirname, 'src/hooks/useGameBroadcast.original.ts');

try {
  // Read the improved version
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }
  
  // Backup the original file if we haven't done that already
  if (fs.existsSync(destFile) && !fs.existsSync(backupFile)) {
    fs.copyFileSync(destFile, backupFile);
    console.log(`Created backup of original hook: ${backupFile}`);
  }
  
  // Copy the improved version to the actual hook file
  fs.copyFileSync(sourceFile, destFile);
  console.log(`Successfully updated hook with real-time improvements.`);
  console.log('The game events should now be propagated more reliably to all clients.');
} catch (error) {
  console.error('Error updating hook:', error);
  process.exit(1);
}
