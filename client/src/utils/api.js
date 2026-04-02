const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  // Don't set Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);
  
  // Handle file downloads
  if (response.headers.get('Content-Type')?.includes('text/csv')) {
    const blob = await response.blob();
    return blob;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

// Folders
export const foldersApi = {
  getAll: () => request('/folders'),
  getOne: (id) => request(`/folders/${id}`),
  create: (name) => request('/folders', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id, name) => request(`/folders/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  delete: (id) => request(`/folders/${id}`, { method: 'DELETE' })
};

// Sets
export const setsApi = {
  getAll: (folderId) => request(`/sets${folderId ? `?folderId=${folderId}` : ''}`),
  getOne: (id) => request(`/sets/${id}`),
  create: (data) => request('/sets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/sets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  move: (id, folderId) => request(`/sets/${id}/move`, { method: 'PUT', body: JSON.stringify({ folderId }) }),
  delete: (id) => request(`/sets/${id}`, { method: 'DELETE' }),
  addCards: (setId, cards) => request(`/sets/${setId}/cards`, { method: 'POST', body: JSON.stringify({ cards }) })
};

// Cards
export const cardsApi = {
  update: (id, data) => request(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/cards/${id}`, { method: 'DELETE' }),
  addAlias: (cardId, alias) => request(`/cards/${cardId}/aliases`, { method: 'POST', body: JSON.stringify({ alias }) }),
  deleteAlias: (aliasId) => request(`/cards/aliases/${aliasId}`, { method: 'DELETE' })
};

// Notes
export const notesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notes${query ? `?${query}` : ''}`);
  },
  getOne: (id) => request(`/notes/${id}`),
  create: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/notes/${id}`, { method: 'DELETE' })
};

// Cornell Notes
export const cornellNotesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/cornell-notes${query ? `?${query}` : ''}`);
  },
  getOne: (id) => request(`/cornell-notes/${id}`),
  create: (data) => request('/cornell-notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/cornell-notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/cornell-notes/${id}`, { method: 'DELETE' })
};

// Study
export const studyApi = {
  createSession: (setId, mode) => request('/study/sessions', { method: 'POST', body: JSON.stringify({ setId, mode }) }),
  endSession: (id, data) => request(`/study/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordReview: (data) => request('/study/review', { method: 'POST', body: JSON.stringify(data) }),
  getDueCards: (setId) => request(`/study/due-cards${setId ? `?setId=${setId}` : ''}`),
  getSessions: (limit) => request(`/study/sessions?limit=${limit || 20}`)
};

// Progress
export const progressApi = {
  getDashboard: () => request('/progress/dashboard'),
  getSetProgress: (setId) => request(`/progress/sets/${setId}`)
};

// Import/Export
export const importExportApi = {
  importCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/import-export/csv', { method: 'POST', body: formData });
  },
  importPdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/import-export/pdf', { method: 'POST', body: formData });
  },
  saveImported: (data) => request('/import-export/save', { method: 'POST', body: JSON.stringify(data) }),
  generateFromText: (data) => request('/import-export/generate', { method: 'POST', body: JSON.stringify(data) }),
  exportCsv: (setId) => request(`/import-export/export/csv/${setId}`),
  exportJson: (setId) => request(`/import-export/export/json/${setId}`)
};
export const learnApi = {
  getFiles: () => request('/learn/files'),
  getSets: () => request('/learn/sets'),
  generate: (payload) => request('/learn/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  grade: (userAnswer, correctAnswer) => request('/learn/grade', {
    method: 'POST',
    body: JSON.stringify({ userAnswer, correctAnswer })
  })
};
