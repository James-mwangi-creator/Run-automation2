(function(global) {
    'use strict';

    class HybridEngine {
        constructor(config = {}) {
            this.pyodide = null;
            this.storage = null;
            this.marketplace = null;
            this.isReady = false;
            this.config = {
                pyodideURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
                fullStdLib: false,
                packages: ['micropip'],
                ...config
            };
            this.loadPyodide = config.pyodideLoader || global.loadPyodide;
        }

        async init() {
            try {
                console.log('🔄 Initializing Hybrid Engine...');

                if (!this.loadPyodide) {
                    throw new Error('Pyodide loader not found');
                }

                // Initialize storage and marketplace
                this.storage = new global.ScriptStorage();
                this.marketplace = new global.MarketplaceClient();
                console.log('✅ Storage and marketplace ready');

                // Load Pyodide
                console.log('🔄 Loading Pyodide...');
                this.pyodide = await this.loadPyodide({
                    indexURL: this.config.pyodideURL,
                    fullStdLib: this.config.fullStdLib
                });
                console.log('✅ Pyodide loaded');

                // Load micropip
                await this.pyodide.loadPackage('micropip');
                console.log('✅ Micropip loaded');

                this.isReady = true;
                
                // Dispatch event
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('hybrid-ready'));
                }
                
                console.log('✅ Hybrid Engine ready!');
                return this;

            } catch (error) {
                console.error('❌ Engine initialization failed:', error);
                throw error;
            }
        }

        async installScript(scriptId, scriptData) {
            if (!this.storage) throw new Error('Engine not initialized. Call init() first.');
            
            const script = {
                id: scriptId,
                name: scriptData.name || scriptId,
                description: scriptData.description || '',
                author: scriptData.author || 'Unknown',
                version: scriptData.version || '1.0.0',
                code: scriptData.code,
                main: scriptData.main || 'main',
                packages: scriptData.packages || [],
                installedAt: Date.now()
            };

            await this.storage.save(scriptId, script);
            return { success: true, scriptId };
        }

        async runScript(scriptId, input = {}) {
            if (!this.pyodide) throw new Error('Engine not initialized. Call init() first.');
            if (!this.storage) throw new Error('Storage not initialized');

            const script = await this.storage.load(scriptId);
            if (!script) {
                throw new Error(`Script ${scriptId} not found. Install it first.`);
            }

            // Install required packages
            if (script.packages && script.packages.length > 0) {
                const micropip = this.pyodide.pyimport('micropip');
                for (const pkg of script.packages) {
                    try {
                        await micropip.install(pkg);
                    } catch (e) {
                        console.warn(`Failed to install package ${pkg}:`, e);
                    }
                }
            }

            // Run the script
            this.pyodide.runPython(script.code);
            this.pyodide.globals.set('_input', input);
            
            const result = await this.pyodide.runPython(`
                import json
                try:
                    output = main(_input)
                    json.dumps(output)
                except Exception as e:
                    json.dumps({'error': str(e)})
            `);

            return JSON.parse(result);
        }

        async listScripts() {
            if (!this.storage) throw new Error('Engine not initialized');
            return this.storage.getAll();
        }

        async uninstallScript(scriptId) {
            if (!this.storage) throw new Error('Engine not initialized');
            return this.storage.delete(scriptId);
        }

        async isInstalled(scriptId) {
            if (!this.storage) throw new Error('Engine not initialized');
            return this.storage.exists(scriptId);
        }
    }

    // CRITICAL: Expose to global scope
    global.HybridEngine = HybridEngine;
    console.log('✅ HybridEngine loaded');

})(typeof window !== 'undefined' ? window : this);
