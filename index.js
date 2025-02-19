const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const loadDbPermission = require('./middleware/loadUserPermissionMiddleware');
const appRoutes = require('./routes/appRoutes');
const db = require('./models');
const helmet = require('helmet');

const app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

// app.options('*', cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(bodyParser.json());
app.use(loadDbPermission);
app.use(cors());

app.use('/api', appRoutes);

app.get('/', function (req, res) {
  const htmlResponse = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Development Server</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f9;
                        color: #333;
                    }
                    h1 {
                        font-size: 3rem;
                        color: #4CAF50;
                        margin-bottom: 20px;
                    }
                    p {
                        font-size: 1.2rem;
                        margin: 10px 0;
                    }
                    footer {
                        position: absolute;
                        bottom: 10px;
                        font-size: 0.9rem;
                        color: #666;
                    }
                    a {
                        color: #4CAF50;
                        text-decoration: none;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <h1>Development Server is Running 🚀</h1>
                <p>Welcome to the backend of your awesome project!</p>
                <p>Stay productive and build something amazing. 💻✨</p>
                <p>You can login to the web application through <a href="https://cadstream.ebjv.e-fab.com.au/">here</a></p>
                <footer>
                    <p>&copy; 2018 EBJV. Powered by <a href="https://nodejs.org" target="_blank">Node.js</a>.</p>
                </footer>
            </body>
            </html>
        `;
  res.send(htmlResponse);
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
