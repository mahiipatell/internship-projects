import api from './api';

export const moviesService = {
  trending: (mediaType = 'all', timeWindow = 'week', page = 1) =>
    api.get('/movies/trending', { params: { mediaType, timeWindow, page } }).then((r) => r.data),

  popular: (mediaType = 'movie', page = 1) =>
    api.get('/movies/popular', { params: { mediaType, page } }).then((r) => r.data),

  topRated: (mediaType = 'movie', page = 1) =>
    api.get('/movies/top-rated', { params: { mediaType, page } }).then((r) => r.data),

  upcoming: (page = 1) => api.get('/movies/upcoming', { params: { page } }).then((r) => r.data),

  nowPlaying: (mediaType = 'movie', page = 1) =>
    api.get('/movies/now-playing', { params: { mediaType, page } }).then((r) => r.data),

  genres: (mediaType = 'movie') => api.get('/movies/genres', { params: { mediaType } }).then((r) => r.data),

  byGenre: (genreId, mediaType = 'movie', page = 1, sortBy = 'popularity.desc') =>
    api.get(`/movies/genre/${genreId}`, { params: { mediaType, page, sortBy } }).then((r) => r.data),

  search: (query, type = 'multi', page = 1) =>
    api.get('/movies/search', { params: { query, type, page } }).then((r) => r.data),

  details: (mediaType, id) => api.get(`/movies/${mediaType}/${id}`).then((r) => r.data),

  person: (id) => api.get(`/movies/person/${id}`).then((r) => r.data),
};

export const watchlistService = {
  list: () => api.get('/watchlist').then((r) => r.data),
  add: (payload) => api.post('/watchlist', payload).then((r) => r.data),
  remove: (tmdbId, mediaType) => api.delete(`/watchlist/${tmdbId}/${mediaType}`).then((r) => r.data),
};

export const favoritesService = {
  list: () => api.get('/favorites').then((r) => r.data),
  add: (payload) => api.post('/favorites', payload).then((r) => r.data),
  remove: (tmdbId, mediaType) => api.delete(`/favorites/${tmdbId}/${mediaType}`).then((r) => r.data),
};

export const ratingsService = {
  list: () => api.get('/ratings').then((r) => r.data),
  rate: (payload) => api.post('/ratings', payload).then((r) => r.data),
  remove: (tmdbId, mediaType) => api.delete(`/ratings/${tmdbId}/${mediaType}`).then((r) => r.data),
};

export const historyService = {
  list: () => api.get('/history').then((r) => r.data),
  add: (payload) => api.post('/history', payload).then((r) => r.data),
  removeEntry: (id) => api.delete(`/history/${id}`).then((r) => r.data),
  clear: () => api.delete('/history').then((r) => r.data),
};

export const recommendationsService = {
  get: (mediaType = 'movie') => api.get('/recommendations', { params: { mediaType } }).then((r) => r.data),
};
