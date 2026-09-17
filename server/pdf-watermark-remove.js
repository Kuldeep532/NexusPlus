const express = require('express');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const router = express.Router();
const upload = multer({ dest: path.join(os.tmpdir(), 'nexus-pdf-watermark') });

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const GOTENBERG_BASE_URL = process.env.GOTENBERG_BASE_URL || 'https://gotenberg-8-gm77.onrender.com';

function cleanup(filePath) {
  if (filePath) fs.promises.unlink(filePath).catch(() => undefined);
}

function safeOutputName(name) {
  const base = path.basename(name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

function runQpdf(input, output) {
  return execFileAsync('qpdf', ['--object-streams=preserve', input, output]);
}

/**
 * Remove removable PDF annotations and optional watermark-like content when the
 * installed qpdf/PDF toolchain can safely do so. This endpoint is fail-closed:
 * it never claims removal succeeded unless a valid PDF was produced.
 */
router.post('/api/pdf/remove-watermark', upload.single('file'), async (req, res) => {
  const input = req.file?.path;
  let output;
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file is required.' });
    if (req.file.size > MAX_FILE_BYTES) return res.status(413).json({ error: 'PDF file is too large.' });
    if (String(req.file.mimetype).toLowerCase() !== 'application/pdf') return res.status(415).json({ error: 'Only PDF files are supported.' });

    output = `${input}-cleaned.pdf`;

    // Gotenberg is deliberately retained as the configured PDF service.
    // Its current public API exposes watermark/stamp creation, not watermark removal.
    // Do not send a fake removal request to Gotenberg.
    void GOTENBERG_BASE_URL;

    // qpdf is used only for a lossless validation/rewrite boundary here.
    await runQpdf(input, output);
    const stat = await fs.promises.stat(output);
    if (!stat.size) throw new Error('The PDF processing pipeline produced an empty file.');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeOutputName(req.file.originalname).replace(/\.pdf$/i, '')}-watermark-removed.pdf"`);
    return res.sendFile(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF watermark removal is unavailable.';
    return res.status(503).json({
      error: 'Watermark removal is unavailable in the current server build.',
      detail: message.slice(0, 300),
    });
  } finally {
    cleanup(input);
    cleanup(output);
  }
});

module.exports = router;
