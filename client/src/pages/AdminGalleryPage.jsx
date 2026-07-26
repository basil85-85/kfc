import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { FiImage, FiPlus, FiTrash2, FiEdit2, FiX, FiFolder, FiCheck } from 'react-icons/fi';

const AdminGalleryPage = () => {
  const [albums, setAlbums] = useState([]);
  const [name, setName] = useState('');
  const [cover, setCover] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo upload to album state
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [caption, setCaption] = useState('');

  // Editing Album state
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [albumForm, setAlbumForm] = useState({ name: '', cover: '' });

  // Editing Photo state
  const [editingPhoto, setEditingPhoto] = useState(null); // { albumId, photo }
  const [photoForm, setPhotoForm] = useState({ url: '', caption: '' });

  // Currently expanded album for viewing photo grid
  const [expandedAlbumId, setExpandedAlbumId] = useState(null);

  const toast = useToast();

  const loadAlbums = async () => {
    try {
      const { data } = await api.get('/gallery');
      setAlbums(data);
      if (data.length > 0 && !selectedAlbumId) {
        setSelectedAlbumId(data[0]._id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await api.post('/gallery/albums', { name, cover });
      toast?.addToast('Album created successfully!', 'success');
      setName('');
      setCover('');
      loadAlbums();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not create album', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAlbum = async (e) => {
    e.preventDefault();
    if (!editingAlbum) return;
    try {
      await api.put(`/gallery/albums/${editingAlbum._id}`, albumForm);
      toast?.addToast('Album updated successfully!', 'success');
      setEditingAlbum(null);
      loadAlbums();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to update album', 'error');
    }
  };

  const handleDeleteAlbum = async (albumId, albumName) => {
    if (!window.confirm(`Delete album "${albumName}" and all of its photos?`)) return;
    try {
      await api.delete(`/gallery/albums/${albumId}`);
      toast?.addToast('Album deleted successfully', 'success');
      if (expandedAlbumId === albumId) setExpandedAlbumId(null);
      loadAlbums();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not delete album', 'error');
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!selectedAlbumId || !photoURL) return;
    try {
      await api.post(`/gallery/albums/${selectedAlbumId}/photos`, {
        photos: [{ url: photoURL, caption }],
      });
      toast?.addToast('Photo added to album!', 'success');
      setPhotoURL('');
      setCaption('');
      loadAlbums();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to add photo', 'error');
    }
  };

  const handleEditPhotoClick = (albumId, photo) => {
    setEditingPhoto({ albumId, photo });
    setPhotoForm({ url: photo.url || '', caption: photo.caption || '' });
  };

  const handleUpdatePhoto = async (e) => {
    e.preventDefault();
    if (!editingPhoto) return;
    try {
      await api.put(`/gallery/albums/${editingPhoto.albumId}/photos/${editingPhoto.photo._id}`, photoForm);
      toast?.addToast('Photo updated successfully!', 'success');
      setEditingPhoto(null);
      loadAlbums();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to update photo', 'error');
    }
  };

  const handleDeletePhoto = async (albumId, photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      await api.delete(`/gallery/albums/${albumId}/photos/${photoId}`);
      toast?.addToast('Photo deleted successfully', 'success');
      loadAlbums();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to delete photo', 'error');
    }
  };

  if (loading) return <Loading message="Loading gallery manager..." />;

  return (
    <div className="space-y-8">
      <header className="glass-card">
        <span className="section-label">Media Assets</span>
        <h1 className="font-display text-3xl font-black text-white">Gallery Manager</h1>
        <p className="text-xs text-slate-300">Create photo albums, upload matchday photography, edit captions, and delete images.</p>
      </header>

      {/* Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Album */}
        <form onSubmit={handleCreateAlbum} className="glass-card space-y-4">
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <FiPlus className="text-cyan-400" /> Create New Album
          </h2>

          <div>
            <label className="label-dark">Album Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark"
              placeholder="Matchday 5 vs Kadhavu FC"
              required
            />
          </div>

          <div>
            <label className="label-dark">Cover Image URL</label>
            <input
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              className="input-dark"
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-4 text-xs font-bold gap-1.5">
            <FiPlus size={14} />
            <span>Create Album</span>
          </button>
        </form>

        {/* Add Photo to Album */}
        <form onSubmit={handleAddPhoto} className="glass-card space-y-4">
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <FiImage className="text-teal-400" /> Upload Photo to Album
          </h2>

          <div>
            <label className="label-dark">Select Target Album</label>
            <select
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              className="select-dark"
              required
            >
              <option value="">Choose Album</option>
              {albums.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.photos?.length || 0} photos)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-dark">Photo Image URL</label>
            <input
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="input-dark"
              placeholder="https://example.com/photo.jpg"
              required
            />
          </div>

          <div>
            <label className="label-dark">Photo Caption</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-dark"
              placeholder="Goal celebration in 88th minute"
            />
          </div>

          <button type="submit" className="btn-secondary py-2 px-4 text-xs font-bold gap-1.5">
            <FiPlus size={14} />
            <span>Add Photo</span>
          </button>
        </form>
      </div>

      {/* Albums Summary & Photo Manager */}
      <div className="space-y-6">
        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <FiFolder className="text-amber-400" /> Manage Photo Albums & Images
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => {
            const isExpanded = expandedAlbumId === album._id;
            return (
              <div key={album._id} className="glass-card space-y-4 border-white/10 hover:border-cyan-500/30 transition">
                {/* Album Cover & Header */}
                <div className="relative h-44 overflow-hidden rounded-xl bg-slate-900 group">
                  {album.cover ? (
                    <img src={album.cover} alt={album.name} className="h-full w-full object-cover" />
                  ) : album.photos?.length > 0 ? (
                    <img src={album.photos[0].url} alt={album.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs font-semibold">No Cover Image</div>
                  )}

                  {/* Top Action Overlay */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-90 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditingAlbum(album);
                        setAlbumForm({ name: album.name || '', cover: album.cover || '' });
                      }}
                      className="rounded-lg bg-slate-950/80 p-2 text-cyan-300 backdrop-blur-md hover:bg-cyan-500 hover:text-slate-950 transition"
                      title="Edit Album Details"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAlbum(album._id, album.name)}
                      className="rounded-lg bg-slate-950/80 p-2 text-rose-400 backdrop-blur-md hover:bg-rose-500 hover:text-white transition"
                      title="Delete Album"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">{album.name}</h3>
                    <p className="text-xs text-slate-400">{album.photos?.length || 0} Photos recorded</p>
                  </div>

                  <button
                    onClick={() => setExpandedAlbumId(isExpanded ? null : album._id)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    {isExpanded ? 'Hide Photos' : 'Manage Photos'}
                  </button>
                </div>

                {/* Expanded Photos Grid inside Album */}
                {isExpanded && (
                  <div className="mt-4 border-t border-white/10 pt-4 space-y-3 animate-fade-in">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Album Photos ({album.photos?.length || 0})
                    </span>

                    {album.photos?.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {album.photos.map((photo) => (
                          <div key={photo._id} className="relative rounded-xl border border-white/10 bg-slate-900/90 p-2 space-y-2 group">
                            <div className="h-28 overflow-hidden rounded-lg bg-slate-950">
                              <img src={photo.url} alt="" className="h-full w-full object-cover" />
                            </div>
                            <p className="text-[11px] text-slate-300 truncate" title={photo.caption}>
                              {photo.caption || 'No caption'}
                            </p>

                            <div className="flex items-center justify-between border-t border-white/10 pt-1.5">
                              <button
                                onClick={() => handleEditPhotoClick(album._id, photo)}
                                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                <FiEdit2 size={12} /> Edit Caption
                              </button>
                              <button
                                onClick={() => handleDeletePhoto(album._id, photo._id)}
                                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                              >
                                <FiTrash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-2">No photos inside this album yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Album Modal */}
      {editingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleUpdateAlbum} className="glass-card w-full max-w-md border-cyan-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-white">Edit Album Details</h3>
              <button type="button" onClick={() => setEditingAlbum(null)} className="text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <div>
              <label className="label-dark">Album Name</label>
              <input
                value={albumForm.name}
                onChange={(e) => setAlbumForm((p) => ({ ...p, name: e.target.value }))}
                className="input-dark"
                required
              />
            </div>

            <div>
              <label className="label-dark">Cover Image URL</label>
              <input
                value={albumForm.cover}
                onChange={(e) => setAlbumForm((p) => ({ ...p, cover: e.target.value }))}
                className="input-dark"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingAlbum(null)} className="btn-secondary text-xs py-2 px-4">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-4 font-bold">
                Save Album Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleUpdatePhoto} className="glass-card w-full max-w-md border-cyan-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-white">Edit Photo Information</h3>
              <button type="button" onClick={() => setEditingPhoto(null)} className="text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <div>
              <label className="label-dark">Photo Image URL</label>
              <input
                value={photoForm.url}
                onChange={(e) => setPhotoForm((p) => ({ ...p, url: e.target.value }))}
                className="input-dark"
                required
              />
            </div>

            <div>
              <label className="label-dark">Photo Caption</label>
              <input
                value={photoForm.caption}
                onChange={(e) => setPhotoForm((p) => ({ ...p, caption: e.target.value }))}
                className="input-dark"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingPhoto(null)} className="btn-secondary text-xs py-2 px-4">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-4 font-bold">
                Save Photo Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminGalleryPage;
