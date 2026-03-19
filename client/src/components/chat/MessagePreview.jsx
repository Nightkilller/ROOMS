import { useState } from 'react';

export default function MessagePreview({ message }) {
    const [lightbox, setLightbox] = useState(false);
    const { messageType, fileUrl, fileName, fileSize, text } = message;

    if (messageType === 'text' || (!fileUrl && messageType === 'text')) return null;

    const formatSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    // ── Image preview ────────────────────────────────────────
    if (messageType === 'image') {
        return (
            <>
                <div className="mt-1 cursor-pointer" onClick={() => setLightbox(true)}>
                    <img
                        src={fileUrl}
                        alt={fileName || 'Image'}
                        className="max-w-[280px] max-h-[200px] rounded-lg object-cover hover:opacity-90 transition"
                        loading="lazy"
                    />
                </div>
                {text && <p className="text-sm mt-1 break-words whitespace-pre-wrap">{text}</p>}

                {/* Lightbox */}
                {lightbox && (
                    <div
                        className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-pointer"
                        onClick={() => setLightbox(false)}
                    >
                        <img
                            src={fileUrl}
                            alt={fileName || 'Image'}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="absolute bottom-6 right-6 bg-brand-500/80 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-500 transition"
                        >
                            ↓ Download
                        </a>
                    </div>
                )}
            </>
        );
    }

    // ── PDF preview ──────────────────────────────────────────
    if (messageType === 'pdf') {
        return (
            <div className="mt-1">
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-dark-600/50 hover:bg-dark-600 rounded-lg p-3 transition max-w-[280px]"
                >
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM6 20V4h7v5a1 1 0 001 1h5v10H6z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileName || 'Document.pdf'}</p>
                        <p className="text-xs text-dark-300">{formatSize(fileSize)} • PDF</p>
                    </div>
                </a>
                {text && <p className="text-sm mt-1 break-words whitespace-pre-wrap">{text}</p>}
            </div>
        );
    }

    // ── Voice message ────────────────────────────────────────
    if (messageType === 'voice' || messageType === 'audio') {
        return (
            <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">🎙️</span>
                <audio src={fileUrl} controls className="h-8 max-w-[200px] rounded" />
            </div>
        );
    }

    // ── Video preview ────────────────────────────────────────
    if (messageType === 'video') {
        return (
            <div className="mt-1">
                <video src={fileUrl} controls className="max-w-[280px] rounded-lg" />
                {text && <p className="text-sm mt-1 break-words whitespace-pre-wrap">{text}</p>}
            </div>
        );
    }

    // ── Generic file preview ─────────────────────────────────
    return (
        <div className="mt-1">
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-dark-600/50 hover:bg-dark-600 rounded-lg p-3 transition max-w-[280px]"
            >
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName || 'File'}</p>
                    <p className="text-xs text-dark-300">{formatSize(fileSize)}</p>
                </div>
                <svg className="w-4 h-4 text-dark-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            </a>
            {text && <p className="text-sm mt-1 break-words whitespace-pre-wrap">{text}</p>}
        </div>
    );
}
