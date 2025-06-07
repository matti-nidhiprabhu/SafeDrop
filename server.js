const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Store expiry info
const fileExpiryMap = new Map();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  const filename = req.file.filename;
  const expiry = Date.now() + 20000; // 20 seconds
  fileExpiryMap.set(filename, expiry);

  // Schedule deletion
  setTimeout(() => {
    const filePath = path.join(__dirname, "uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filename}`);
    }
    fileExpiryMap.delete(filename);
  }, 20000);

  // Redirect user to download page with filename param
  res.redirect(`/download.html?file=${encodeURIComponent(filename)}`);
});

// API endpoint to get time left for a file
app.get("/api/timeleft/:filename", (req, res) => {
  const filename = req.params.filename;
  const expiry = fileExpiryMap.get(filename);
  const filePath = path.join(__dirname, "uploads", filename);

  if (!expiry || !fs.existsSync(filePath)) {
    return res.json({ expired: true });
  }

  const timeLeft = Math.max(0, Math.floor((expiry - Date.now()) / 1000));

  res.json({ expired: timeLeft <= 0, timeLeft });
});

// Serve actual file download
app.get("/file/:filename", (req, res) => {
  const filename = req.params.filename;
  const expiry = fileExpiryMap.get(filename);
  const filePath = path.join(__dirname, "uploads", filename);

  if (!expiry || Date.now() > expiry || !fs.existsSync(filePath)) {
    return res.sendFile(path.join(__dirname, "public", "expired.html"));
  }

  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`SafeDrop running at http://localhost:${PORT}`);
});
