require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const host = "127.0.0.1";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.use(bodyParser.json({ limit: '10mb' })); 
app.use(express.static('public'));

app.post("/api/chat", async (req, res) => {
    const userMessage = req.body.message;
    const userImage = req.body.image;

    try {
        if (userImage) {
            const base64Data = userImage.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const imageName = `${uuidv4()}.png`;
            const imagePath = path.join(__dirname, 'images', imageName);
            fs.writeFileSync(imagePath, imageBuffer);

            
            const result = await processImage(imagePath);
            res.json({ image: result });
        } else {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(userMessage);
            const response = await result.response;
            const text = await response.text();
            res.json({ reply: text });
        }
    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

async function processImage(imagePath) {
    // Implement your image processing logic here
    // For demonstration, let's just return the same image
    return `data:image/png;base64,${fs.readFileSync(imagePath, 'base64')}`;
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port || process.env.PORT, () => {
    console.log(`Server is running at http://${host}:${port}`);
});
