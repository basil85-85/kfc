import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { FiImage, FiHeart, FiFolder } from 'react-icons/fi';

const GalleryPage = () => {
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/gallery');
        setAlbums(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading message="Loading club gallery media..." />;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <header className="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <span className="section-label">Media & Moments</span>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">Club Gallery</h1>
          <p className="text-sm text-slate-300">
            Matchday photography, trophy celebrations, training sessions, and club events.
          </p>
        </div>

        {activeAlbum && (
          <button
            onClick={() => setActiveAlbum(null)}
            className="btn-secondary text-xs py-2 px-4 self-start sm:self-auto"
          >
            ← Back to All Albums
          </button>
        )}
      </header>

      {/* Album Detail View */}
      {activeAlbum ? (
        <div className="glass-card space-y-6">
          <div className="border-b border-white/[0.06] pb-4">
            <span className="section-label">Viewing Album</span>
            <h2 className="font-display text-2xl font-bold text-white">{activeAlbum.name}</h2>
            <p className="text-xs text-slate-400">{activeAlbum.photos?.length || 0} Photos uploaded</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {activeAlbum.photos?.map((photo, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900 shadow-lg"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Club photo'}
                  className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-3 backdrop-blur-md">
                    <p className="text-xs font-semibold text-white">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
            {(!activeAlbum.photos || activeAlbum.photos.length === 0) && (
              <p className="py-12 text-center text-xs text-slate-500 col-span-3">
                No photos inside this album yet. Upload photos from the admin panel!
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Albums Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <article
              key={album._id}
              onClick={() => setActiveAlbum(album)}
              className="glass-card-hover cursor-pointer group space-y-4"
            >
              <div className="relative h-56 overflow-hidden rounded-2xl bg-slate-900">
                {album.cover ? (
                  <img
                    src={album.cover}
                    alt={album.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-600">
                    <FiFolder size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-cyan-300 backdrop-blur-md">
                  {album.photos?.length || 0} Photos
                </div>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {album.name}
                </h3>
                <p className="mt-1 text-xs text-slate-400">Click to view photos</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {albums.length === 0 && (
        <div className="glass-card p-12 text-center text-slate-400">
          <FiImage size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="font-display text-lg font-bold text-white">No gallery albums available yet.</p>
          <p className="mt-1 text-xs">Create albums and upload photos from the admin panel!</p>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
