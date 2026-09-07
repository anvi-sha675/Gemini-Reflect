import * as db from '../services/firestore.service.js';

export async function exportUserData(req, res, next) {
  try {
    const data = await db.exportAllUserData(req.uid);
    res.setHeader('Content-Disposition', 'attachment; filename="gemini-reflect-export.json"');
    res.json(data);
  } catch (err) {
    next(err);
  }
}
