const Gallery = require('../models/Gallery');
const cloudinary = require('../utils/cloudinary');

const getGallery = async (req, res) => {
  const albums = await Gallery.find().sort({ date: -1 });
  res.json(albums);
};

const createAlbum = async (req, res) => {
  const { name, date, cover } = req.body;
  const album = await Gallery.create({
    name,
    date: date ? new Date(date) : new Date(),
    cover,
    createdBy: req.user._id,
  });
  res.status(201).json(album);
};

const uploadPhotos = async (req, res) => {
  const album = await Gallery.findById(req.params.id);
  if (!album) {
    res.status(404);
    throw new Error('Album not found');
  }
  const { photos } = req.body;
  if (!Array.isArray(photos)) {
    res.status(400);
    throw new Error('Photos array required');
  }

  const uploaded = [];
  for (const photo of photos) {
    if (photo.url) {
      uploaded.push({ url: photo.url, caption: photo.caption || '' });
    } else if (photo.base64) {
      const result = await cloudinary.uploader.upload(photo.base64, { folder: 'kfc-gallery' });
      uploaded.push({ url: result.secure_url, caption: photo.caption || '' });
    }
  }
  album.photos.push(...uploaded);
  await album.save();
  res.json(album);
};

const likePhoto = async (req, res) => {
  const album = await Gallery.findById(req.params.albumId);
  if (!album) {
    res.status(404);
    throw new Error('Album not found');
  }
  const photo = album.photos.id(req.params.photoId);
  if (!photo) {
    res.status(404);
    throw new Error('Photo not found');
  }
  const hasLiked = photo.likes.some((id) => id.equals(req.user._id));
  if (!hasLiked) {
    photo.likes.push(req.user._id);
    await album.save();
  }
  res.json(photo);
};

const updateAlbum = async (req, res) => {
  const album = await Gallery.findById(req.params.id);
  if (!album) {
    res.status(404);
    throw new Error('Album not found');
  }
  const { name, cover, date } = req.body;
  if (name) album.name = name;
  if (cover !== undefined) album.cover = cover;
  if (date) album.date = new Date(date);

  await album.save();
  res.json(album);
};

const deleteAlbum = async (req, res) => {
  const album = await Gallery.findById(req.params.id);
  if (!album) {
    res.status(404);
    throw new Error('Album not found');
  }
  await album.deleteOne();
  res.json({ message: 'Album deleted successfully' });
};

const updatePhoto = async (req, res) => {
  const album = await Gallery.findById(req.params.albumId);
  if (!album) {
    res.status(404);
    throw new Error('Album not found');
  }
  const photo = album.photos.id(req.params.photoId);
  if (!photo) {
    res.status(404);
    throw new Error('Photo not found');
  }
  const { url, caption } = req.body;
  if (url) photo.url = url;
  if (caption !== undefined) photo.caption = caption;

  await album.save();
  res.json(album);
};

const deletePhoto = async (req, res) => {
  const album = await Gallery.findById(req.params.albumId);
  if (!album) {
    res.status(404);
    throw new Error('Album not found');
  }
  album.photos.pull(req.params.photoId);
  await album.save();
  res.json(album);
};

module.exports = {
  getGallery,
  createAlbum,
  uploadPhotos,
  likePhoto,
  updateAlbum,
  deleteAlbum,
  updatePhoto,
  deletePhoto,
};
