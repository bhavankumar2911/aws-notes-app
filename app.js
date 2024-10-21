// Import necessary modules
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

// Create an Express application
const app = express();

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Parse URL-encoded bodies (form submissions)
app.use(bodyParser.urlencoded({ extended: false }));

// MySQL connection to Amazon RDS
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

// Create the notes table if it doesn't exist
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;
connection.query(createTableQuery, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Notes table exists or created successfully.');
    }
});

// Route to display the index page with the form and notes
app.get('/', (req, res) => {
    const query = 'SELECT * FROM notes ORDER BY created_at DESC';
    connection.query(query, (err, notes) => {
        if (err) {
            console.error('Error fetching notes:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Render the index.ejs view with notes
        res.render('index', { notes });
    });
});

// Route to handle form submission and add a new note
app.post('/notes', (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const query = `INSERT INTO notes (title, content) VALUES (?, ?)`;
    connection.query(query, [title, content], (err, result) => {
        if (err) {
            console.error('Error inserting note:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Redirect back to the index page after adding the note
        res.redirect('/');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
