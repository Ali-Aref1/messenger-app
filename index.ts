import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 4173;

// Use __filename and __dirname in a TypeScript-compatible way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all other routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(parseInt(port as string), '0.0.0.0', () => {
  console.log(`React frontend is running on port ${port}`);
});
