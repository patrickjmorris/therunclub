import { loadInitialData } from '../src/db/index.js';

async function main() {
  try {
    await loadInitialData();
    console.log('Initial data loaded successfully');
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

main().then(() => process.exit(0));