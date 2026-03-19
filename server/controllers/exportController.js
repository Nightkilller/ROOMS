const PDFDocument = require('pdfkit');
const User = require('../models/User');
const LoginSession = require('../models/LoginSession');

// ── PDF EXPORT ────────────────────────────────────────────────
exports.exportPDF = async (req, res) => {
    try {
        const { status, from, to } = req.query;
        const query = {};
        if (status === 'verified') query.isVerified = true;
        if (status === 'unverified') query.isVerified = false;
        if (status === 'locked') query.isLocked = true;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const users = await User.find(query).select('fullName email isVerified isLocked role createdAt').sort({ createdAt: -1 });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=rooms-users-report.pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(22).fillColor('#7c3aed').text('ROOMS — User Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#666').text(`Total Users: ${users.length}`, { align: 'center' });
        doc.moveDown(1);

        // Divider
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#7c3aed').lineWidth(1).stroke();
        doc.moveDown(0.8);

        // Table header
        const tableTop = doc.y;
        const colWidths = [130, 160, 70, 60, 80];
        const headers = ['Name', 'Email', 'Status', 'Role', 'Joined'];

        doc.fontSize(9).fillColor('#7c3aed');
        let x = 50;
        headers.forEach((h, i) => {
            doc.text(h, x, tableTop, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
        });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').lineWidth(0.5).stroke();
        doc.moveDown(0.3);

        // Table rows
        doc.fontSize(8).fillColor('#333');
        users.forEach((u) => {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }
            const y = doc.y;
            let rx = 50;
            const statusText = u.isLocked ? 'Locked' : u.isVerified ? 'Verified' : 'Unverified';
            const row = [
                u.fullName,
                u.email,
                statusText,
                u.role,
                u.createdAt.toLocaleDateString(),
            ];
            row.forEach((cell, i) => {
                doc.text(cell || '-', rx, y, { width: colWidths[i], align: 'left' });
                rx += colWidths[i];
            });
            doc.moveDown(0.4);
        });

        doc.end();
    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).json({ message: 'Export failed.' });
    }
};

// ── CSV EXPORT ────────────────────────────────────────────────
exports.exportCSV = async (req, res) => {
    try {
        const { status, from, to } = req.query;
        const query = {};
        if (status === 'verified') query.isVerified = true;
        if (status === 'unverified') query.isVerified = false;
        if (status === 'locked') query.isLocked = true;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const users = await User.find(query).select('fullName email isVerified isLocked role createdAt').sort({ createdAt: -1 });

        const enriched = await Promise.all(
            users.map(async (u) => {
                const last = await LoginSession.findOne({ userId: u._id, successful: true }).sort({ loginAt: -1 });
                return { ...u.toObject(), lastLogin: last?.loginAt || '', lastIP: last?.ipAddress || '', lastCity: last?.city || '' };
            })
        );

        let csv = 'Name,Email,Status,Role,Joined,Last Login,Last IP,Last City\n';
        enriched.forEach((u) => {
            const statusText = u.isLocked ? 'Locked' : u.isVerified ? 'Verified' : 'Unverified';
            csv += `"${u.fullName}","${u.email}","${statusText}","${u.role}","${u.createdAt.toISOString()}","${u.lastLogin || ''}","${u.lastIP}","${u.lastCity}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=rooms-users-report.csv');
        res.send(csv);
    } catch (err) {
        console.error('CSV export error:', err);
        res.status(500).json({ message: 'Export failed.' });
    }
};
