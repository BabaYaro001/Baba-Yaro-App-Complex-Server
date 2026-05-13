require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

const allowedOrigins = [
  'https://babayaroupdated.netlify.app',
  'http://localhost:5000',
  process.env.FRONTEND_URL || 'https://babayaroupdated.netlify.app',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.post('/api/remove-background', upload.single('image'), async (req, res) => {
  const apiKey = process.env.REMOVE_BG_API_KEY || 'tP44LzdZtWF99ZnpLt2cQSNB';
  if (!apiKey) {
    return res.status(500).json({ error: 'REMOVE_BG_API_KEY is not set in the backend environment.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image file was provided.' });
  }

  try {
    const form = new FormData();
    form.append('image_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append('size', 'auto');

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
      headers: {
        'X-Api-Key': apiKey,
        ...form.getHeaders(),
      },
      responseType: 'arraybuffer',
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Background removal error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.errors?.[0]?.title || error.response?.data || error.message;
    res.status(500).json({ error: String(errorMessage) });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Background remover backend listening on port ${PORT}`);
});
