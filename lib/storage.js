// Simple localStorage-based data management

export const storage = {
  // Profile
  getProfile: (username) => {
    const data = localStorage.getItem(`profile_${username}`);
    return data ? JSON.parse(data) : {
      username,
      name: '',
      bio: '',
      niche_tags: [],
      positioning_statement: '',
      avatar: null,
      location: '',
      languages: [],
      socials: { instagram: '', tiktok: '', youtube: '', canva: '', email: '' },
      why_work_with_me: '',
    };
  },

  saveProfile: (username, profile) => {
    localStorage.setItem(`profile_${username}`, JSON.stringify(profile));
  },

  // Content Library
  getContent: (username) => {
    const data = localStorage.getItem(`content_${username}`);
    return data ? JSON.parse(data) : [];
  },

  saveContent: (username, content) => {
    localStorage.setItem(`content_${username}`, JSON.stringify(content));
  },

  addContentItem: (username, item) => {
    const content = storage.getContent(username);
    const newItem = {
      id: Date.now().toString(),
      ...item,
      created_at: new Date().toISOString(),
    };
    content.push(newItem);
    storage.saveContent(username, content);
    return newItem;
  },

  updateContentItem: (username, id, updates) => {
    const content = storage.getContent(username);
    const index = content.findIndex(c => c.id === id);
    if (index !== -1) {
      content[index] = { ...content[index], ...updates };
      storage.saveContent(username, content);
    }
  },

  deleteContentItem: (username, id) => {
    const content = storage.getContent(username);
    const filtered = content.filter(c => c.id !== id);
    storage.saveContent(username, filtered);
  },

  // Pitches
  getPitches: (username) => {
    const data = localStorage.getItem(`pitches_${username}`);
    return data ? JSON.parse(data) : [];
  },

  savePitches: (username, pitches) => {
    localStorage.setItem(`pitches_${username}`, JSON.stringify(pitches));
  },

  addPitch: (username, pitch) => {
    const pitches = storage.getPitches(username);
    const newPitch = {
      id: Date.now().toString(),
      slug: `pitch_${Date.now()}`,
      customContent: null,
      ...pitch,
      created_at: new Date().toISOString(),
      opens: [],
    };
    pitches.push(newPitch);
    storage.savePitches(username, pitches);
    return newPitch;
  },

  getPitch: (username, id) => {
    const pitches = storage.getPitches(username);
    return pitches.find(p => p.id === id);
  },

  deletePitch: (username, id) => {
    const pitches = storage.getPitches(username).filter(p => p.id !== id);
    storage.savePitches(username, pitches);
  },

  deletePitches: (username, ids) => {
    const pitches = storage.getPitches(username).filter(p => !ids.includes(p.id));
    storage.savePitches(username, pitches);
  },

  updatePitch: (username, id, updates) => {
    const pitches = storage.getPitches(username);
    const index = pitches.findIndex(p => p.id === id);
    if (index !== -1) {
      pitches[index] = { ...pitches[index], ...updates };
      storage.savePitches(username, pitches);
    }
  },

  // Brand settings
  getBrand: (username) => {
    const defaults = { colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'], font: 'Inter', templateId: 'modern' };
    const data = localStorage.getItem(`brand_${username}`);
    if (!data) return defaults;
    const parsed = JSON.parse(data);
    if (parsed.colors && parsed.colors.length < 4) parsed.colors[3] = '#111111';
    return { ...defaults, ...parsed };
  },

  saveBrand: (username, brand) => {
    localStorage.setItem(`brand_${username}`, JSON.stringify(brand));
  },

  // Folders
  getFolders: (username) => {
    const data = localStorage.getItem(`folders_${username}`);
    return data ? JSON.parse(data) : [];
  },

  saveFolders: (username, folders) => {
    localStorage.setItem(`folders_${username}`, JSON.stringify(folders));
  },

  addFolder: (username, name) => {
    const folders = storage.getFolders(username);
    const folder = { id: Date.now().toString(), name };
    folders.push(folder);
    storage.saveFolders(username, folders);
    return folder;
  },

  deleteFolder: (username, folderId) => {
    const folders = storage.getFolders(username).filter(f => f.id !== folderId);
    storage.saveFolders(username, folders);
    // clear folderId from any pitches that were in it
    const pitches = storage.getPitches(username).map(p =>
      p.folderId === folderId ? { ...p, folderId: null } : p
    );
    storage.savePitches(username, pitches);
  },

  movePitchesToFolder: (username, pitchIds, folderId) => {
    const pitches = storage.getPitches(username).map(p =>
      pitchIds.includes(p.id) ? { ...p, folderId: folderId ?? null } : p
    );
    storage.savePitches(username, pitches);
  },

  recordPitchOpen: (username, pitchId) => {
    const pitch = storage.getPitch(username, pitchId);
    if (pitch) {
      const opens = pitch.opens || [];
      opens.push({
        timestamp: new Date().toISOString(),
      });
      storage.updatePitch(username, pitchId, { opens });
    }
  },

  // Plan / trial
  getPlanData: (username) => {
    const data = localStorage.getItem(`plan_${username}`);
    return data ? JSON.parse(data) : null;
  },

  setPlanData: (username, data) => {
    localStorage.setItem(`plan_${username}`, JSON.stringify(data));
  },

  initTrial: (username) => {
    const existing = storage.getPlanData(username);
    if (!existing) {
      storage.setPlanData(username, {
        plan: 'trial',
        trialStartedAt: new Date().toISOString(),
      });
    }
  },

  getPlanStatus: (username) => {
    const data = storage.getPlanData(username);
    if (!data) return { status: 'trial', daysLeft: 3 };
    if (data.plan === 'pro') return { status: 'pro', daysLeft: null };
    if (data.plan === 'starter') return { status: 'starter', daysLeft: null };

    const daysSince = (Date.now() - new Date(data.trialStartedAt).getTime()) / 86400000;
    const daysLeft = Math.max(0, 3 - Math.floor(daysSince));
    return daysLeft > 0
      ? { status: 'trial', daysLeft }
      : { status: 'expired', daysLeft: 0 };
  },

  getMonthlyPitchCount: (username) => {
    const now = new Date();
    return storage.getPitches(username).filter(p => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  },
};

// Export utility for formatting
export const utils = {
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  formatTime: (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  },

  getRelevantContent: (allContent, tags, limit = 5) => {
    if (!tags || tags.length === 0) return allContent.slice(0, limit);
    
    const scored = allContent.map(item => {
      const itemTags = item.tags || [];
      const matches = itemTags.filter(t => tags.includes(t)).length;
      return { ...item, relevance_score: matches };
    });

    return scored
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
  },
};
