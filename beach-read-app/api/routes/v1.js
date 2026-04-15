const express = require('express');
const { authMiddleware } = require('../lib/auth');
const backendService = require('../services/backendService');

const router = express.Router();

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      const status = error.status || 500;
      res.status(status).json({
        message: error.message || 'Unexpected error',
        details: error.details || null,
      });
    }
  };
}

router.use(authMiddleware);

router.get('/library', asyncRoute(async (req, res) => {
  const result = await backendService.listLibrary(req.user.id, req.query);
  res.json(result);
}));

router.post('/library', asyncRoute(async (req, res) => {
  const result = await backendService.createLibraryEntry(req.user.id, req.body);
  res.status(201).json({
    requestId: result.requestId,
    serverAccepted: true,
    entity: result.entity,
    entryVersion: result.entity.entry_version,
    syncState: { pushQueued: false, jobId: null },
  });
}));

router.patch('/library/:entryId', asyncRoute(async (req, res) => {
  const result = await backendService.patchLibraryEntry(req.user.id, req.params.entryId, req.body);
  res.json({
    requestId: result.requestId,
    serverAccepted: true,
    entity: result.entity,
    entryVersion: result.entity.entry_version,
    syncState: { pushQueued: result.entity.last_mutation_source === 'WEB', jobId: null },
  });
}));

router.post('/library/:entryId/progress', asyncRoute(async (req, res) => {
  const result = await backendService.recordProgress(req.user.id, req.params.entryId, req.body);
  res.json({
    requestId: result.requestId,
    serverAccepted: true,
    entity: result.entity,
    entryVersion: result.entity.entry_version,
    syncState: { pushQueued: true, jobId: null },
  });
}));

router.delete('/library/:entryId', asyncRoute(async (req, res) => {
  res.json(await backendService.deleteLibraryEntry(req.user.id, req.params.entryId));
}));

router.get('/collections', asyncRoute(async (req, res) => {
  res.json(await backendService.listCollections(req.user.id));
}));

router.post('/collections', asyncRoute(async (req, res) => {
  res.status(201).json(await backendService.createCollection(req.user.id, req.body));
}));

router.patch('/collections/:collectionId', asyncRoute(async (req, res) => {
  res.json(await backendService.patchCollection(req.user.id, req.params.collectionId, req.body));
}));

router.delete('/collections/:collectionId', asyncRoute(async (req, res) => {
  res.json(await backendService.deleteCollection(req.user.id, req.params.collectionId));
}));

router.post('/collections/:collectionId/items', asyncRoute(async (req, res) => {
  res.status(201).json(await backendService.addCollectionItem(req.user.id, req.params.collectionId, req.body));
}));

router.delete('/collections/:collectionId/items/:titleId', asyncRoute(async (req, res) => {
  res.json(await backendService.deleteCollectionItem(req.user.id, req.params.collectionId, req.params.titleId));
}));

router.post('/collections/:collectionId/reorder', asyncRoute(async (req, res) => {
  res.json(await backendService.reorderCollectionItems(req.user.id, req.params.collectionId, req.body.items || []));
}));

router.get('/library/:entryId/notes', asyncRoute(async (req, res) => {
  res.json(await backendService.listNotes(req.user.id, req.params.entryId));
}));

router.post('/library/:entryId/notes', asyncRoute(async (req, res) => {
  res.status(201).json(await backendService.createNote(req.user.id, req.params.entryId, req.body));
}));

router.patch('/notes/:noteId', asyncRoute(async (req, res) => {
  res.json(await backendService.patchNote(req.user.id, req.params.noteId, req.body));
}));

router.delete('/notes/:noteId', asyncRoute(async (req, res) => {
  res.json(await backendService.deleteNote(req.user.id, req.params.noteId));
}));

router.get('/notifications', asyncRoute(async (req, res) => {
  res.json(await backendService.listNotifications(req.user.id));
}));

router.post('/notifications/read', asyncRoute(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const results = [];
  for (const id of ids) {
    results.push(await backendService.markNotificationRead(req.user.id, id));
  }
  res.json(results);
}));

router.post('/notifications/read-all', asyncRoute(async (req, res) => {
  res.json(await backendService.markAllNotificationsRead(req.user.id));
}));

router.get('/sync/connections', asyncRoute(async (req, res) => {
  res.json(await backendService.listSyncConnections(req.user.id));
}));

router.post('/sync/:provider/connect', asyncRoute(async (req, res) => {
  res.status(201).json(await backendService.upsertSyncConnection(req.user.id, req.params.provider, req.body));
}));

router.post('/sync/:provider/trigger', asyncRoute(async (req, res) => {
  res.status(202).json(await backendService.triggerSyncJob(req.user.id, req.params.provider, req.body));
}));

router.get('/sync/jobs', asyncRoute(async (req, res) => {
  res.json(await backendService.listSyncJobs(req.user.id));
}));

router.get('/sync/jobs/:jobId', asyncRoute(async (req, res) => {
  res.json(await backendService.getSyncJob(req.user.id, req.params.jobId));
}));

router.get('/sync/conflicts', asyncRoute(async (req, res) => {
  res.json(await backendService.listSyncConflicts(req.user.id));
}));

router.post('/sync/conflicts/:conflictId/resolve', asyncRoute(async (req, res) => {
  res.json(await backendService.resolveSyncConflict(req.user.id, req.params.conflictId, req.body));
}));

router.get('/recommendations/:kind', asyncRoute(async (req, res) => {
  res.json(await backendService.getRecommendations(req.user.id, req.params.kind));
}));

module.exports = router;
