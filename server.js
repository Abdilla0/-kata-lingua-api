const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json({ limit: "20mb" }));

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "kata-lingua.appspot.com", 
});

const bucket = admin.storage().bucket();

app.post("/upload", async (req, res) => {
  try {
    const { base64, filename, contentType, metadata } = req.body;
    const buffer = Buffer.from(base64, "base64");

    const file = bucket.file(`audios/${filename}`);
    await file.save(buffer, { metadata: { contentType } });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    await admin.firestore().collection("submissions").add({
      ...metadata,
      audioURL: url,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ url });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
