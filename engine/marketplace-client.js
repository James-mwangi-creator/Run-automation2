(function(global) {
    'use strict';

    class MarketplaceClient {
        constructor(apiURL = 'https://api.hybrid.market/v1') {
            this.apiURL = apiURL;
            this.cache = new Map();
        }

        async search(query, category = 'all') {
            // Mock data for MVP - Works offline
            const offlineScripts = [
                {
                    id: 'invoice-reader',
                    name: 'Invoice Reader',
                    description: 'Extract data from invoice images',
                    author: 'Hybrid Labs',
                    version: '1.0.0',
                    rating: 4.8,
                    downloads: '50K+',
                    offline: true,
                    code: `
def main(input):
    return {
        'invoice_number': 'INV-2024-001',
        'amount': '$1,234.56',
        'date': '2024-01-15',
        'vendor': 'ACME Corp'
    }
`
                },
                {
                    id: 'receipt-splitter',
                    name: 'Receipt Splitter',
                    description: 'Split receipt items into categories',
                    author: 'Hybrid Labs',
                    version: '1.0.0',
                    rating: 4.6,
                    downloads: '32K+',
                    offline: true,
                    code: `
def main(input):
    return {
        'items': [
            {'name': 'Item 1', 'price': 10.99},
            {'name': 'Item 2', 'price': 24.99}
        ],
        'total': 35.98,
        'tax': 2.80
    }
`
                },
                {
                    id: 'hello-world',
                    name: 'Hello World',
                    description: 'Simple test script',
                    author: 'Hybrid Labs',
                    version: '1.0.0',
                    rating: 5.0,
                    downloads: '10K+',
                    offline: true,
                    code: `
def main(input):
    name = input.get('name', 'World')
    return {'message': f'Hello {name}!'}
`
                }
            ];

            if (!query) return offlineScripts;
            
            const lowerQuery = query.toLowerCase();
            return offlineScripts.filter(s => 
                s.name.toLowerCase().includes(lowerQuery) ||
                s.description.toLowerCase().includes(lowerQuery)
            );
        }

        async download(scriptId) {
            const scripts = await this.search('');
            const script = scripts.find(s => s.id === scriptId);
            
            if (!script) {
                throw new Error(`Script ${scriptId} not found`);
            }

            return {
                id: script.id,
                name: script.name,
                description: script.description,
                author: script.author,
                version: script.version,
                code: script.code,
                main: 'main',
                packages: []
            };
        }

        async getPopular(limit = 10) {
            const scripts = await this.search('');
            return scripts.slice(0, limit);
        }
    }

    // CRITICAL: Expose to global scope
    global.MarketplaceClient = MarketplaceClient;
    console.log('✅ MarketplaceClient loaded');

})(typeof window !== 'undefined' ? window : this);
