const parseHighlightVideo = (url) => {
  if (!url || !url.trim()) {
    return { raw: '', embed: '' };
  }
  const clean = url.trim();

  // YouTube Patterns
  const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      raw: clean,
      embed: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }

  // Vimeo Patterns
  const vimeoMatch = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      raw: clean,
      embed: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  throw new Error('Invalid highlight video URL. Please provide a valid YouTube or Vimeo link.');
};

module.exports = { parseHighlightVideo };
