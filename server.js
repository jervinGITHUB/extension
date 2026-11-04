import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve static assets from workspace root
app.use(express.static(__dirname));

// Default route serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve extension popup directly if requested
app.get('/popup', (req, res) => {
  res.sendFile(path.join(__dirname, 'popup', 'popup.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`NMC_PATHAN applet running on http://${HOST}:${PORT}`);
});
