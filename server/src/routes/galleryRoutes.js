const express = require('express');
const {
  getGallery,
  createAlbum,
  uploadPhotos,
  likePhoto,
  updateAlbum,
  deleteAlbum,
  updatePhoto,
  deletePhoto,
} = require('../controllers/galleryController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getGallery);
router.post('/albums', protect, admin, createAlbum);
router.post('/albums/:id/photos', protect, admin, uploadPhotos);
router.put('/albums/:id', protect, admin, updateAlbum);
router.delete('/albums/:id', protect, admin, deleteAlbum);

router.put('/albums/:albumId/photos/:photoId', protect, admin, updatePhoto);
router.delete('/albums/:albumId/photos/:photoId', protect, admin, deletePhoto);

router.post('/:albumId/photos/:photoId/like', protect, likePhoto);

module.exports = router;
