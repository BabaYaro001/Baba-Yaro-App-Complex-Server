require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const ytdlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://babayaroupdated.netlify.app', // Added common production origin
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
}));

// YouTube Downloader Endpoint
app.post('/api/download', async (req, res) => {
  const { url, format } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const outputFileName = `video_${timestamp}.%(ext)s`;
  const outputPath = path.join(downloadsDir, outputFileName);

  try {
    const options = {
      output: outputPath,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    };

    if (format === 'audio') {
      options.extractAudio = true;
      options.audioFormat = 'mp3';
    } else {
      // Best quality video + audio
      options.format = 'bestvideo+bestaudio/best';
    }

    await ytdlp(url, options);

    // Find the actual file (yt-dlp replaces %(ext)s)
    const files = fs.readdirSync(downloadsDir);
    const actualFile = files.find(f => f.includes(`video_${timestamp}`));

    if (!actualFile) {
      throw new Error('Downloaded file not found on server');
    }

    const filePath = path.join(downloadsDir, actualFile);
    res.download(filePath, actualFile, (err) => {
      if (err) console.error('Error sending file:', err);

      // Cleanup
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 60000); // 1 minute delay for cleanup
    });
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Download failed. Ensure the link is valid and yt-dlp is installed on the server.' });
  }
});

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

// Serve the React frontend if the build exists
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
