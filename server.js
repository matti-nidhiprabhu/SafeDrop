// server.js
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// File storage config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(6).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Serve upload page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  const fileId = req.file.filename;
  res.send(`<p>Here’s your one-time download link:</p>
            <a href="/download/${fileId}">Download File</a>`);
});

// One-time file download
app.get('/download/:fileId', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.fileId);
  if (fs.existsSync(filePath)) {
    res.download(filePath, () => {
      fs.unlinkSync(filePath); // Delete after download
    });
  } else {
    res.send('File not found or already downloaded.');
  }
});

app.listen(PORT, () => console.log(`SafeDrop running at http://localhost:${PORT}`));
