/**
 * DayFlow — Local Database Manager Client
 * Handles task and settings sync with the local SQLite server via API endpoints.
 * Automatically falls back to localStorage if the SQLite server is unreachable or if opened via file://.
 */

class DatabaseManager {
  constructor() {
    this.apiBase = '/api';
    this.dbAvailable = false;
  }

  /**
   * Initializes the database connection
   * @returns {Promise<boolean>} Resolves to true if API server is reachable
   */
  async init() {
    try {
      const response = await fetch(`${this.apiBase}/tasks`, { method: 'GET' });
      if (response.ok) {
        this.dbAvailable = true;
        console.log('DayFlow Local SQLite Database connected successfully.');
        return true;
      }
      this.dbAvailable = false;
      return false;
    } catch (e) {
      this.dbAvailable = false;
      console.warn('Could not connect to DayFlow local SQLite server. Using local browser storage fallback.', e);
      return false;
    }
  }

  /**
   * Fetch all tasks
   * @returns {Promise<Array>} List of tasks
   */
  async getAllTasks() {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/tasks`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Failed to fetch tasks from SQLite server, reading from localStorage.', e);
      }
    }
    const local = localStorage.getItem('dayflow_tasks');
    return local ? JSON.parse(local) : [];
  }

  /**
   * Add a new task
   * @param {Object} task Task data
   * @returns {Promise<void>}
   */
  async addTask(task) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(task)
        });
        if (response.ok) return;
      } catch (e) {
        console.warn('Failed to add task on SQLite server, falling back to localStorage.', e);
      }
    }
    // Fallback is handled by app.js saving to localStorage
  }

  /**
   * Update an existing task
   * @param {Object} task Task data
   * @returns {Promise<void>}
   */
  async updateTask(task) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(task)
        });
        if (response.ok) return;
      } catch (e) {
        console.warn('Failed to update task on SQLite server, falling back to localStorage.', e);
      }
    }
    // Fallback is handled by app.js saving to localStorage
  }

  /**
   * Delete a task
   * @param {string} id Task unique ID
   * @returns {Promise<void>}
   */
  async deleteTask(id) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/tasks/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) return;
      } catch (e) {
        console.warn('Failed to delete task on SQLite server, falling back to localStorage.', e);
      }
    }
    // Fallback is handled by app.js saving to localStorage
  }

  /**
   * Clear all tasks for a specific date
   * @param {string} dateStr YYYY-MM-DD
   * @returns {Promise<number>} Number of deleted tasks
   */
  async clearDayTasks(dateStr) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/tasks/date/${dateStr}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          const result = await response.json();
          return result.cleared || 0;
        }
      } catch (e) {
        console.warn('Failed to clear day tasks on SQLite server, falling back to localStorage.', e);
      }
    }
    // Local fallback: count how many tasks would be deleted
    const local = localStorage.getItem('dayflow_tasks');
    if (local) {
      try {
        const tasks = JSON.parse(local);
        const filtered = tasks.filter(t => t.date === dateStr);
        return filtered.length;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Bulk insert tasks
   * @param {Array} tasks List of task objects
   * @returns {Promise<number>} Number of tasks added
   */
  async importTasks(tasks) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/tasks/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tasks)
        });
        if (response.ok) {
          const result = await response.json();
          return result.imported || 0;
        }
      } catch (e) {
        console.warn('Failed to import tasks on SQLite server, falling back to localStorage.', e);
      }
    }
    return tasks.length;
  }

  // ==========================================
  // Settings sync APIs
  // ==========================================

  /**
   * Save settings
   * @param {Object} settings Key-value preferences
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    if (this.dbAvailable) {
      try {
        await fetch(`${this.apiBase}/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        });
      } catch (e) {
        console.warn('Error saving settings to SQLite server:', e);
      }
    }
  }

  /**
   * Load settings
   * @returns {Promise<Object>} Preferences object
   */
  async getSettings() {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/settings`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Error fetching settings from SQLite server:', e);
      }
    }
    const local = localStorage.getItem('dayflow_settings');
    return local ? JSON.parse(local) : {};
  }
  // ==========================================
  // Jobs sync APIs
  // ==========================================
  
  async getJobs() {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/jobs`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Error fetching jobs:', e);
      }
    }
    const local = localStorage.getItem('dayflow_jobs');
    return local ? JSON.parse(local) : [];
  }

  async addJob(job) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job)
        });
        if (response.ok) return;
      } catch (e) {
        console.warn('Error adding job:', e);
      }
    }
  }

  async deleteJob(id) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/jobs/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) return;
      } catch (e) {
        console.warn('Error deleting job:', e);
      }
    }
  }
  // ==========================================
  // Cold Mails sync APIs
  // ==========================================
  
  async getColdMails() {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/cold_mails`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Error fetching cold mails:', e);
      }
    }
    const local = localStorage.getItem('dayflow_cold_mails');
    return local ? JSON.parse(local) : [];
  }

  async addColdMail(coldMail) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/cold_mails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coldMail)
        });
        if (response.ok) return;
      } catch (e) {
        console.warn('Error adding cold mail:', e);
      }
    }
  }

  async deleteColdMail(id) {
    if (this.dbAvailable) {
      try {
        const response = await fetch(`${this.apiBase}/cold_mails/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) return;
      } catch (e) {
        console.warn('Error deleting cold mail:', e);
      }
    }
  }
}

// Instantiate globally
window.dbManager = new DatabaseManager();
