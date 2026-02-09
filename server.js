const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from root

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'image/') // Save to 'image' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

const DATA_FILE = 'projects.json';

// Get Projects
app.get('/api/projects', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            // If file doesn't exist, return empty array
            if (err.code === 'ENOENT') return res.json([]);
            return res.status(500).send('Error reading data');
        }
        res.json(JSON.parse(data));
    });
});

// Add Project
app.post('/api/projects', upload.single('image'), (req, res) => {
    const { title, description, url, iconType, emojiIcon } = req.body;
    let icon = emojiIcon;
    
    // If an image file was uploaded, use its path (relative)
    if (req.file) {
        icon = `image/${req.file.filename}`;
    }

    const newProject = {
        id: Date.now(),
        title,
        description,
        url: url || '#',
        icon,
        isImage: !!req.file // Flag to know if it's an image path or emoji
    };

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        let projects = [];
        if (!err) {
            projects = JSON.parse(data);
        }
        
        projects.push(newProject);

        fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving data');
            res.json(newProject);
        });
    });
});

// Delete Project (Optional, for full admin)
app.delete('/api/projects/:id', (req, res) => {
    const id = parseInt(req.params.id);
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading data');
        
        let projects = JSON.parse(data);
        projects = projects.filter(p => p.id !== id);

        fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving data');
            res.json({ success: true });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
