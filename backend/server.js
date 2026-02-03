require('dotenv').config();
const app = require('./src/app');
const fs = require('fs-extra');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
