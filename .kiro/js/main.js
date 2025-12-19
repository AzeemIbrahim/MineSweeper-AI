/**
 * Main Entry Point
 * Initializes the game and sets up event handlers
 */

import { initializeState, State } from './state.js';
import { restartBtn, aiPanel, aiPanelContent, updateUI, renderBoard, updateGameStatus, enableRestartButton, removeGameOverClass, initializeUIModule } from './ui.js';
import { displayAIHint } from './ai.js';
import { initializeGameModule } from './game.js';

// DOM elements
const aiHintBtn = document.getElementById('ai-hint-btn');
const aiPanelClose = document.getElementById('ai-panel-close');

/**
 * Initialize the game
 */
export function initGame() {
    // Reset game state
    initializeState();

    // Close AI panel
    aiPanel.classList.remove('open');
    aiPanelContent.innerHTML = '<p class="ai-placeholder">Click "Ask AI for Hint" to get a suggestion!</p>';

    // Update UI
    updateUI();
    renderBoard();
    updateGameStatus('Ready');
    enableRestartButton();
    removeGameOverClass();
}

/**
 * Restart button handler
 */
restartBtn.addEventListener('click', () => {
    if (!restartBtn.disabled) {
        initGame();
    }
});

/**
 * AI Hint button handler - toggles the panel open/closed
 */
aiHintBtn.addEventListener('click', () => {
    // Toggle: if panel is open, close it
    if (aiPanel.classList.contains('open')) {
        aiPanel.classList.remove('open');
        return;
    }
    
    // Panel is closed, so open it and show appropriate content
    if (State.firstClick) {
        aiPanelContent.innerHTML = '<p class="ai-placeholder">Start playing to get AI hints!</p>';
        aiPanel.classList.add('open');
    } else if (State.gameOver) {
        aiPanelContent.innerHTML = '<p class="ai-placeholder">Game is over. Start a new game to get AI hints!</p>';
        aiPanel.classList.add('open');
    } else {
        // Game is in progress - show hint or message to keep exploring
        displayAIHint();
    }
});

/**
 * Close AI panel handler
 */
aiPanelClose.addEventListener('click', () => {
    aiPanel.classList.remove('open');
});

// Initialize game module dependencies
initializeGameModule();

// Initialize UI module (sets up connection with game.js) - use async/await
initializeUIModule().then(() => {
    // Initialize game on page load after modules are connected
    initGame();
}).catch((error) => {
    console.error('Error initializing UI module:', error);
    // Still try to initialize the game even if there's an error
    initGame();
});

