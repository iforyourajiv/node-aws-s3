const express = require("express");
const cors = require("cors");
const app = express();
const { getAllBuckets,uploadDocument,getAllUploadDocument} = require("./s3Handler");

require('dotenv').config();

// Corrected the CORS middleware usage (it should be invoked as a function)
app.use(cors());

// Route to get all buckets
app.get('/getAllBuckets', getAllBuckets);
app.get('/getAllUploadDocument',getAllUploadDocument)
app.post('/uploadDocument',uploadDocument);
// Root route
app.get('/', (req, res) => {
    console.log("hello");
    res.status(200).json({
        message: "Running"
    });

});

// Start the server on the defined port
app.listen(process.env.PORT, (err) => {
    if (err) {
        throw new Error('Server failed to start');
    }
    console.log(`Server running on port ${process.env.PORT}`);
});
