import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from project root
app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  index: 'index.html'
}));

// Route for retro arcade games hub
app.get('/games', (req, res) => {
  res.redirect('/games/');
});

// Serve root index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pawjects server running at http://0.0.0.0:${PORT}`);
});
