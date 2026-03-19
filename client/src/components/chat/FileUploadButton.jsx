import { useState, useRef } from 'react';
import { uploadFile } from '../../api/chatApi';
import toast from 'react-hot-toast';

export default function FileUploadButton({ onFileUploaded, disabled }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleClick = () => {
        if (!disabled && !uploading) fileInputRef.current?.click();
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const { data } = await uploadFile(file, (pct) => setProgress(pct));

            // Determine message type from MIME
            let messageType = 'file';
            if (file.type.startsWith('image/')) messageType = 'image';
            else if (file.type === 'application/pdf') messageType = 'pdf';

            onFileUploaded({
                messageType,
                fileUrl: data.url,
                fileName: data.fileName,
                fileSize: data.fileSize,
            });

            toast.success('File uploaded!');
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setProgress(0);
            // Reset input so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFile}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
            />
            <button
                onClick={handleClick}
                disabled={disabled || uploading}
                className="p-2.5 rounded-lg text-dark-100 hover:text-brand-400 hover:bg-brand-500/10 transition disabled:opacity-40"
                title="Attach file"
            >
                {uploading ? (
                    <div className="w-5 h-5 relative">
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeDashoffset={31.4 - (31.4 * progress / 100)} className="text-brand-500" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                            {progress}
                        </span>
                    </div>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                )}
            </button>
        </div>
    );
}
