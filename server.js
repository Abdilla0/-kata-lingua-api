const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cloudinary = require("./cloudinary");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

// MongoDB
require("./db");
const Submission = require("./models/Submission");

// POST /upload
app.post("/upload", async (req, res) => {
  try {
    const { base64, filename, contentType, metadata } = req.body;

    if (!base64 || !filename || !contentType || !metadata) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const uploadRes = await cloudinary.uploader.upload(
      `data:${contentType};base64,${base64}`,
      {
        resource_type: "video",
        folder: "kata-audio",
        public_id: filename.split(".")[0],
      }
    );

    const submission = await Submission.create({
      audioURL: uploadRes.secure_url,
      contentType,
      ...metadata,
    });

    console.log("✅ Uploaded and saved:", submission.audioURL);
    res.status(200).json({ message: "✅ Uploaded", url: submission.audioURL });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /submissions
app.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error("❌ Failed to fetch:", err);
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
