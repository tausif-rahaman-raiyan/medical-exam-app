/**
 * User Profile Management
 * Handles API key input, storage, and profile settings
 */

class ProfileManager {
    constructor() {
        this.storageKey = 'medicalExamApp_apiKey';
        this.apiKey = localStorage.getItem(this.storageKey) || '';
    }

    /**
     * Save API key to localStorage
     */
    saveApiKey(key) {
        if (!key || key.trim() === '') {
            console.error('API key cannot be empty');
            return false;
        }
        try {
            localStorage.setItem(this.storageKey, key);
            this.apiKey = key;
            window.GEMINI_API_KEY = key; // Update global API key
            console.log('API key saved successfully');
            return true;
        } catch (e) {
            console.error('Error saving API key:', e);
            return false;
        }
    }

    /**
     * Get stored API key
     */
    getApiKey() {
        return this.apiKey;
    }

    /**
     * Check if API key is valid
     */
    isApiKeyValid() {
        const key = this.getApiKey();
        return key && key.length > 20; // Basic validation
    }

    /**
     * Delete API key
     */
    deleteApiKey() {
        try {
            localStorage.removeItem(this.storageKey);
            this.apiKey = '';
            window.GEMINI_API_KEY = '__SECRET_KEY__';
            console.log('API key deleted');
            return true;
        } catch (e) {
            console.error('Error deleting API key:', e);
            return false;
        }
    }

    /**
     * Show API key modal
     */
    showApiKeyModal() {
        const modal = document.createElement('div');
        modal.id = 'api-key-modal';
        modal.className = 'fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                <div class="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
                    <h3 class="font-bold text-lg"><i class="fa fa-key mr-2"></i>API Configuration</h3>
                    <button class="hover:text-red-300 transition-colors" id="close-api-modal"><i class="fa fa-times text-xl"></i></button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-200">
                            <i class="fa fa-google mr-2 text-red-500"></i>Gemini API Key
                        </label>
                        <input 
                            type="password" 
                            id="api-key-input" 
                            class="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            placeholder="Enter your Gemini API key..."
                            value="${this.apiKey}"
                        />
                        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                            Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-purple-600 dark:text-purple-400 hover:underline">Google AI Studio</a>
                        </p>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p class="text-[12px] text-blue-800 dark:text-blue-200">
                            <i class="fa fa-info-circle mr-2"></i>
                            Your API key is stored locally in your browser and never sent to our servers.
                        </p>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button id="save-api-btn" class="flex-1 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                            <i class="fa fa-save"></i>Save Key
                        </button>
                        <button id="clear-api-btn" class="flex-1 bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                            <i class="fa fa-trash"></i>Clear
                        </button>
                    </div>

                    ${this.apiKey ? `
                        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p class="text-[12px] text-green-800 dark:text-green-200">
                                <i class="fa fa-check-circle mr-2"></i>
                                API key is configured ✓
                            </p>
                        </div>
                    ` : `
                        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p class="text-[12px] text-yellow-800 dark:text-yellow-200">
                                <i class="fa fa-exclamation-triangle mr-2"></i>
                                No API key configured. Exams may not work properly.
                            </p>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('close-api-modal').onclick = () => modal.remove();
        document.getElementById('save-api-btn').onclick = () => {
            const key = document.getElementById('api-key-input').value;
            if (this.saveApiKey(key)) {
                alert('✓ API key saved successfully!');
                modal.remove();
                this.updateProfileDropdown();
            } else {
                alert('✗ Failed to save API key. Please try again.');
            }
        };
        document.getElementById('clear-api-btn').onclick = () => {
            if (confirm('Are you sure you want to delete your API key?')) {
                this.deleteApiKey();
                modal.remove();
                this.updateProfileDropdown();
            }
        };

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    /**
     * Update profile dropdown with API status
     */
    updateProfileDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        if (!userDropdown) return;

        const statusText = this.isApiKeyValid() ? '✓ Active' : '✗ Not Set';
        const statusClass = `ml-auto text-[10px] font-bold uppercase ${this.isApiKeyValid() ? 'text-green-500' : 'text-rose-500'} px-2 py-1 rounded bg-black/5`;

        // Check for the static button in index.html first (id="apiSettingsBtn")
        const staticBtn = document.getElementById('apiSettingsBtn');
        if (staticBtn) {
            const statusSpan = document.getElementById('apiStatus') || staticBtn.querySelector('span:last-child');
            if (statusSpan) {
                statusSpan.className = statusClass;
                statusSpan.textContent = statusText;
            }
            staticBtn.onclick = () => this.showApiKeyModal();
            return;
        }

        // For question pages: find or create a dynamic button
        let apiBtn = document.getElementById('api-settings-btn');
        if (!apiBtn) {
            apiBtn = document.createElement('button');
            apiBtn.id = 'api-settings-btn';
            apiBtn.className = 'w-full text-left px-5 py-3 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center text-blue-600 dark:text-blue-400 border-t border-zinc-200 dark:border-zinc-700';
            apiBtn.innerHTML = `
                <i class="fa fa-key mr-3"></i>
                <span>API Key</span>
                <span class="${statusClass}">${statusText}</span>
            `;
            apiBtn.onclick = () => this.showApiKeyModal();
            userDropdown.appendChild(apiBtn);
        } else {
            const statusSpan = apiBtn.querySelector('span:last-child');
            if (statusSpan) {
                statusSpan.className = statusClass;
                statusSpan.textContent = statusText;
            }
        }
    }

    /**
     * Initialize profile manager
     */
    init() {
        // Set global API key
        if (this.apiKey) {
            window.GEMINI_API_KEY = this.apiKey;
        }
        
        // Update dropdown on page load
        setTimeout(() => this.updateProfileDropdown(), 500);

        // Update when profile dropdown is shown
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                setTimeout(() => this.updateProfileDropdown(), 100);
            });
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
    window.profileManager.init();
});

// Export for use
window.ProfileManager = ProfileManager;
