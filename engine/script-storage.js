(function(global) {
    'use strict';

    class ScriptStorage {
        constructor(dbName = 'HybridEngine', version = 1) {
            this.dbName = dbName;
            this.version = version;
            this.db = null;
        }

        async openDB() {
            if (this.db) return this.db;

            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => reject(new Error(`Database error: ${request.error}`));
                
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    if (!db.objectStoreNames.contains('scripts')) {
                        const store = db.createObjectStore('scripts', { keyPath: 'id' });
                        store.createIndex('name', 'name', { unique: false });
                        store.createIndex('author', 'author', { unique: false });
                        store.createIndex('installedAt', 'installedAt', { unique: false });
                    }

                    if (!db.objectStoreNames.contains('packages')) {
                        db.createObjectStore('packages', { keyPath: 'name' });
                    }
                };
            });
        }

        async save(id, script) {
            await this.openDB();
            
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('scripts', 'readwrite');
                const store = tx.objectStore('scripts');
                
                const data = {
                    id,
                    ...script,
                    updatedAt: Date.now()
                };

                const request = store.put(data);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new Error(`Save error: ${request.error}`));
            });
        }

        async load(id) {
            await this.openDB();
            
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('scripts', 'readonly');
                const store = tx.objectStore('scripts');
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new Error(`Load error: ${request.error}`));
            });
        }

        async delete(id) {
            await this.openDB();
            
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('scripts', 'readwrite');
                const store = tx.objectStore('scripts');
                const request = store.delete(id);
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(new Error(`Delete error: ${request.error}`));
            });
        }

        async getAll() {
            await this.openDB();
            
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('scripts', 'readonly');
                const store = tx.objectStore('scripts');
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(new Error(`GetAll error: ${request.error}`));
            });
        }

        async exists(id) {
            try {
                const script = await this.load(id);
                return !!script;
            } catch {
                return false;
            }
        }

        async search(query) {
            const all = await this.getAll();
            const lowerQuery = query.toLowerCase();
            
            return all.filter(script => 
                script.name?.toLowerCase().includes(lowerQuery) ||
                script.author?.toLowerCase().includes(lowerQuery) ||
                script.description?.toLowerCase().includes(lowerQuery)
            );
        }
    }

    // CRITICAL: Expose to global scope
    global.ScriptStorage = ScriptStorage;
    console.log('✅ ScriptStorage loaded');

})(typeof window !== 'undefined' ? window : this);
