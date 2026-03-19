const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary from env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary and return its URL.
 * POST /api/upload
 */
exports.uploadFile = async (req, res) => {
    try {
        const file = req.file;

        // 1. Cloudinary Upload (if credentials exist)
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
            const resourceType = 'auto';
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'rooms-chat',
                        resource_type: resourceType,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(file.buffer);
            });

            return res.json({
                url: result.secure_url,
                fileName: file.originalname,
                fileSize: file.size,
                publicId: result.public_id,
            });
        }

        // 2. Local Disk Fallback (if no Cloudinary credentials)
        console.warn('⚠️ Cloudinary credentials missing. Falling back to local disk storage.');
        const ext = path.extname(file.originalname);
        const uniqueName = `upload_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        const uploadsDir = path.join(__dirname, '../uploads');
        
        // Ensure directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, uniqueName);
        await fs.promises.writeFile(filePath, file.buffer);

        // Build absolute URL using the incoming request host
        const baseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
        
        return res.json({
            url: `${baseUrl}/uploads/${uniqueName}`,
            fileName: file.originalname,
            fileSize: file.size,
            publicId: uniqueName,
        });
    } catch (err) {
        console.error('Upload error:', err.message || err);
        res.status(500).json({ 
            message: 'File upload failed. Please try again.',
            error: err.message || 'Unknown upload error' 
        });
    }
};
