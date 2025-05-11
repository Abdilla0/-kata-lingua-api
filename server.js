const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

// Ensure /uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Metadata storage file
const metadataFile = path.join(__dirname, "submissions.json");

app.post("/upload", async (req, res) => {
  try {
    const { base64, filename, contentType, metadata } = req.body;

    if (!base64 || !filename || !contentType || !metadata) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const buffer = Buffer.from(base64, "base64");
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Append metadata
    let submissions = [];
    if (fs.existsSync(metadataFile)) {
      submissions = JSON.parse(fs.readFileSync(metadataFile));
    }

    const newEntry = {
      filename,
      contentType,
      ...metadata,
      createdAt: new Date().toISOString(),
    };

    submissions.push(newEntry);
    fs.writeFileSync(metadataFile, JSON.stringify(submissions, null, 2));

    console.log("📁 Saved to:", filePath);
    console.log("📝 Metadata saved for:", filename);

    res.status(200).json({ message: "✅ Uploaded successfully", filename });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
