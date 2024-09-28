const { S3Client, ListBucketsCommand , ListObjectsCommand, GetObjectCommand, PutObjectCommand} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require('dotenv').config();

const multer = require("multer");
const path = require("path");

// Configure your S3 client
const client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        // To get these details, create an IAM user with S3 access policy
        accessKeyId: process.env.AWS_ACCESS_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});
const storage = multer.memoryStorage(); // Use memory storage to directly upload to S3
const upload = multer({ storage });

module.exports = {
    // List all buckets related to this account
    async getAllBuckets(req, res) {
        try {
            const command = new ListBucketsCommand({});
            const { Buckets } = await client.send(command);
            const allBuckets = Buckets.map(bucket => bucket.Name);
            // Corrected `statusCode` to `status` and added proper response format
            return res.status(200).json({ allBuckets });
        } catch (error) {
            console.error('Error fetching S3 buckets:', error);
            // Send a proper error response to the client
            return res.status(500).json({ error: 'Error fetching S3 buckets', details: error.message });
        }
    },
    // Upload document to S3
    uploadDocument: [
        upload.single("document"), // Use multer to handle the file upload
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: "No file uploaded" });
                }
                // Extract file information
                const file = req.file;
                const fileName = `${Date.now()}_${file.originalname}`;

                // Upload the file to S3 bucket
                const uploadParams = {
                    Bucket: process.env.AWS_BUCKET_NAME, // Replace with your S3 bucket name
                    Key: fileName, // File name in the S3 bucket
                    Body: file.buffer, // The file buffer from memory storage
                    ContentType: file.mimetype // Set the content type of the file
                };

                const command = new PutObjectCommand(uploadParams);
                await client.send(command);
                return res.status(200).json({
                    message: "File uploaded successfully",
                    fileName: fileName
                });
            } catch (error) {
                console.error('Error uploading file to S3:', error);
                return res.status(500).json({ error: 'Error uploading file', details: error.message });
            }
        }
    ],

    async getAllUploadDocument(req,res) {
        try {
            const command = new ListObjectsCommand({ Bucket: process.env.AWS_BUCKET_NAME });
            const { Contents } = await client.send(command);
            if (!Contents || Contents.length === 0) {
                return res.status(404).json({ message: "No files found in the bucket." });
            }
            const contentsList = await Promise.all(
                Contents.map(async (file) => {
                    const fileKey = file.Key
                    const urlCommand = new GetObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: fileKey
                    });
                    const fileUrl = await getSignedUrl(client, urlCommand);
                    return {
                        fileName: fileKey,
                        fileUrl: fileUrl
                    };
                })
            )
            return res.status(200).json({
                message: "File fetched successfully ",
                fileName: contentsList
            });
        } catch (error) {
            console.error('Error Fetching Objects', error);
            return res.status(500).json({ error: 'Error Fetching the Objects', details: error.message });
        }
    }
};

