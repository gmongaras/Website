import fs from 'fs';
import path from 'path';

// Check if the YouTube data file exists
const youtubeDataPath = path.join(process.cwd(), 'src', 'youtubeData.js');

try {
  if (!fs.existsSync(youtubeDataPath)) {
    console.log('No YouTube data file found. Run the Python script first.');
    process.exit(0);
  }

  console.log('✅ YouTube data file found and ready');
  console.log('📹 YouTube videos are automatically loaded from youtubeData.js');
  console.log('🔄 No additional processing needed - data.js imports from youtubeData.js');

} catch (error) {
  console.error('❌ Error checking YouTube data file:', error.message);
  process.exit(1);
}
