const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cloudinary = require("./cloudinary");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

const metadataFile = path.join(__dirname, "submissions.json");

// POST /upload → Upload audio + save metadata
app.post("/upload", async (req, res) => {
  try {
    const { base64, filename, contentType, metadata } = req.body;

    if (!base64 || !filename || !contentType || !metadata) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upload to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(
      `data:${contentType};base64,${base64}`,
      {
        resource_type: "video", // audio files go under video
        folder: "kata-audio",
        public_id: filename.split(".")[0],
      }
    );

    // Load existing entries
    let submissions = [];
    if (fs.existsSync(metadataFile)) {
      submissions = JSON.parse(fs.readFileSync(metadataFile));
    }

    // Create new entry
    const newEntry = {
      audioURL: uploadRes.secure_url,
      contentType,
      ...metadata,
      createdAt: new Date().toISOString(),
    };

    // Save
    submissions.push(newEntry);
    fs.writeFileSync(metadataFile, JSON.stringify(submissions, null, 2));

    console.log("✅ Uploaded to Cloudinary:", uploadRes.secure_url);
    res.status(200).json({ message: "✅ Uploaded to Cloudinary", url: uploadRes.secure_url });
  } catch (err) {
    console.error("❌ Cloudinary upload failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /submissions → return saved metadata
app.get("/submissions", (req, res) => {
  try {
    if (!fs.existsSync(metadataFile)) {
      return res.status(200).json([]);
    }

    const submissions = JSON.parse(fs.readFileSync(metadataFile));
    res.status(200).json(submissions);
  } catch (err) {
    console.error("❌ Failed to read submissions:", err);
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

// GET /submissions.json → raw file access
app.get("/submissions.json", (req, res) => {
  try {
    if (!fs.existsSync(metadataFile)) {
      return res.status(404).send("submissions.json not found");
    }

    res.sendFile(metadataFile);
  } catch (err) {
    console.error("❌ Failed to send file:", err);
    res.status(500).send("Error reading file");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
