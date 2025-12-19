// Minesweeper Game Logic

// ============================================================================
// Game Configuration
// ============================================================================
const GRID_SIZE = 8;
const MINE_COUNT = 10;

// ============================================================================
// Groq LLM API Configuration
// ============================================================================
// Set API key via window.GROQ_API_KEY before loading this script
// Example: window.GROQ_API_KEY = 'your-api-key-here';
// If not set, the game will fall back to local explanations
const GROQ_API_KEY = window.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ============================================================================
// Game State
// ============================================================================
let board = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let firstClick = true;
let flagCount = 0;

// DOM elements
const gameBoard = document.getElementById('game-board');
const mineCountEl = document.getElementById('mine-count');
const flagCountEl = document.getElementById('flag-count');
const gameStatusEl = document.getElementById('game-status');
const restartBtn = document.getElementById('restart-btn');
const aiHintBtn = document.getElementById('ai-hint-btn');
const aiPanel = document.getElementById('ai-panel');
const aiPanelContent = document.getElementById('ai-panel-content');
const aiPanelClose = document.getElementById('ai-panel-close');
const helpMenuDropdown = document.getElementById('help-menu-dropdown');
const helpWindow = document.getElementById('help-window');
const helpWindowClose = document.getElementById('help-window-close');
const newGameMenu = document.getElementById('new-game-menu');

// AI state
let aiSuggestedCell = null;

// Initialize the game
function initGame() {
    // Reset game state
    board = [];
    revealed = [];
    flagged = [];
    gameOver = false;
    firstClick = true;
    flagCount = 0;
    aiSuggestedCell = null;

    // Initialize board arrays
    for (let i = 0; i < GRID_SIZE; i++) {
        board[i] = [];
        revealed[i] = [];
        flagged[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            board[i][j] = 0; // 0 = no mine, -1 = mine
            revealed[i][j] = false;
            flagged[i][j] = false;
        }
    }

    // Close AI panel
    aiPanel.classList.remove('open');
    aiPanelContent.innerHTML = '<p class="ai-placeholder">Click "Ask AI for Hint" to get a suggestion!</p>';

    // Update UI
    updateUI();
    renderBoard();
    gameStatusEl.textContent = 'Ready';
    
    // Enable restart button when starting new game
    restartBtn.disabled = false;
}

// Place mines randomly (but not on first click position)
function placeMines(excludeRow, excludeCol) {
    let minesPlaced = 0;
    
    while (minesPlaced < MINE_COUNT) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        
        // Don't place mine on excluded cell or if mine already exists
        if (board[row][col] !== -1 && !(row === excludeRow && col === excludeCol)) {
            board[row][col] = -1;
            minesPlaced++;
        }
    }

    // Calculate adjacent mine counts
    calculateAdjacentCounts();
}

// Calculate number of adjacent mines for each cell
function calculateAdjacentCounts() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] !== -1) {
                let count = 0;
                
                // Check all 8 adjacent cells
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        if (di === 0 && dj === 0) continue;
                        
                        const ni = i + di;
                        const nj = j + dj;
                        
                        if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE) {
                            if (board[ni][nj] === -1) {
                                count++;
                            }
                        }
                    }
                }
                
                board[i][j] = count;
            }
        }
    }
}

// Reveal a cell (left-click)
function revealCell(row, col) {
    // Don't reveal if game is over, already revealed, or flagged
    if (gameOver || revealed[row][col] || flagged[row][col]) {
        return;
    }

    // First click: ensure it's safe by placing mines after first click
    if (firstClick) {
        placeMines(row, col);
        firstClick = false;
        gameStatusEl.textContent = 'Playing';
        
        // Disable restart button when game is in progress
        restartBtn.disabled = true;
    }

    // Check if it's a mine
    if (board[row][col] === -1) {
        // Game over - reveal all mines
        gameOver = true;
        revealed[row][col] = true;
        revealAllMines();
        gameStatusEl.textContent = 'Game Over!';
        gameBoard.classList.add('game-over');
        // Enable restart button when game ends
        restartBtn.disabled = false;
        updateUI();
        renderBoard();
        return;
    }

    // Reveal the cell using flood-fill for empty cells
    floodFillReveal(row, col);

    // Check win condition
    if (checkWin()) {
        gameOver = true;
        gameStatusEl.textContent = 'You Win!';
        gameBoard.classList.add('game-over');
        // Flag remaining mines automatically
        flagAllMines();
        // Enable restart button when game ends
        restartBtn.disabled = false;
    }

    // Clear AI suggestion if the suggested cell was revealed
    if (aiSuggestedCell && revealed[aiSuggestedCell.row] && revealed[aiSuggestedCell.row][aiSuggestedCell.col]) {
        aiSuggestedCell = null;
        aiPanel.classList.remove('open');
    }

    updateUI();
    renderBoard();
}

// Flood-fill reveal: automatically reveal adjacent cells if current cell is empty
function floodFillReveal(row, col) {
    // Boundary check
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return;
    }

    // Don't reveal if already revealed, flagged, or game over
    if (revealed[row][col] || flagged[row][col] || gameOver) {
        return;
    }

    // Reveal this cell
    revealed[row][col] = true;

    // If cell is empty (count is 0), reveal all adjacent cells recursively
    if (board[row][col] === 0) {
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                if (di === 0 && dj === 0) continue;
                floodFillReveal(row + di, col + dj);
            }
        }
    }
}

// Toggle flag on a cell (right-click)
function toggleFlag(row, col) {
    // Don't allow flagging if game is over or cell is already revealed
    if (gameOver || revealed[row][col]) {
        return;
    }

    // Toggle flag
    if (flagged[row][col]) {
        flagged[row][col] = false;
        flagCount--;
    } else {
        flagged[row][col] = true;
        flagCount++;
    }

    // Clear AI suggestion if the suggested cell was flagged/unflagged
    if (aiSuggestedCell && (aiSuggestedCell.row === row && aiSuggestedCell.col === col)) {
        aiSuggestedCell = null;
        aiPanel.classList.remove('open');
    }

    updateUI();
    renderBoard();
}

// Check if player has won
function checkWin() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            // If there's a non-mine cell that isn't revealed, game isn't won yet
            if (board[i][j] !== -1 && !revealed[i][j]) {
                return false;
            }
        }
    }
    return true;
}

// Reveal all mines when game is lost
function revealAllMines() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === -1) {
                revealed[i][j] = true;
            }
        }
    }
}

// Flag all mines when game is won
function flagAllMines() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === -1 && !flagged[i][j]) {
                flagged[i][j] = true;
                flagCount++;
            }
        }
    }
    updateUI();
}

// Update UI elements
function updateUI() {
    mineCountEl.textContent = MINE_COUNT;
    flagCountEl.textContent = flagCount;
}

// Render the game board
function renderBoard() {
    gameBoard.innerHTML = '';

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;

            // REQUIREMENT 3: Highlight the suggested cell visually
            // This adds the 'ai-suggested' CSS class which provides yellow background, orange border, and pulse animation
            if (aiSuggestedCell && aiSuggestedCell.row === i && aiSuggestedCell.col === j) {
                cell.classList.add('ai-suggested');
            }

            if (revealed[i][j]) {
                cell.classList.add('revealed');
                
                if (board[i][j] === -1) {
                    cell.classList.add('mine');
                    // Use GIF image for mine indicator
                    const mineImg = document.createElement('img');
                    mineImg.src = 'assets/mine.gif';
                    mineImg.alt = 'Mine';
                    mineImg.className = 'mine-img';
                    // Fallback to text if image fails to load
                    mineImg.onerror = function() {
                        cell.innerHTML = '💣';
                    };
                    cell.appendChild(mineImg);
                } else if (board[i][j] > 0) {
                    cell.classList.add(`number-${board[i][j]}`);
                    cell.textContent = board[i][j];
                }
            } else if (flagged[i][j]) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            }

            // Left-click: reveal cell
            cell.addEventListener('click', () => {
                revealCell(i, j);
            });

            // Right-click: toggle flag (prevent context menu)
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(i, j);
            });

            gameBoard.appendChild(cell);
        }
    }
}

// Get all adjacent neighbors of a cell
function getNeighbors(row, col) {
    const neighbors = [];
    for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            
            const ni = row + di;
            const nj = col + dj;
            
            if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE) {
                neighbors.push({ row: ni, col: nj });
            }
        }
    }
    return neighbors;
}

// Count flagged neighbors
function countFlaggedNeighbors(row, col) {
    const neighbors = getNeighbors(row, col);
    return neighbors.filter(n => flagged[n.row][n.col]).length;
}

// Count unrevealed neighbors
function countUnrevealedNeighbors(row, col) {
    const neighbors = getNeighbors(row, col);
    return neighbors.filter(n => !revealed[n.row][n.col] && !flagged[n.row][n.col]).length;
}

// Get unrevealed neighbors
function getUnrevealedNeighbors(row, col) {
    const neighbors = getNeighbors(row, col);
    return neighbors.filter(n => !revealed[n.row][n.col] && !flagged[n.row][n.col]);
}

// Helper function to check if a cell is definitely safe based on all neighboring numbered cells
function isCellSafe(row, col) {
    // Get all neighbors of the candidate cell
    const neighbors = getNeighbors(row, col);
    
    // Check each neighboring numbered cell
    for (const neighbor of neighbors) {
        if (revealed[neighbor.row][neighbor.col] && board[neighbor.row][neighbor.col] > 0) {
            const cellNumber = board[neighbor.row][neighbor.col];
            const flaggedNeighborsOfSource = countFlaggedNeighbors(neighbor.row, neighbor.col);
            const unrevealedNeighborsOfSource = getUnrevealedNeighbors(neighbor.row, neighbor.col);
            
            // Check if our candidate cell is a neighbor of this numbered cell
            const isCandidateNeighbor = unrevealedNeighborsOfSource.some(
                n => n.row === row && n.col === col
            );
            
            if (!isCandidateNeighbor) {
                continue; // Our candidate is not a neighbor of this numbered cell
            }
            
            // Rule 1: If numbered cell has exactly as many flags as its number,
            // all remaining unrevealed neighbors (including our candidate) are safe
            if (cellNumber === flaggedNeighborsOfSource) {
                return {
                    safe: true,
                    reason: `Row ${neighbor.row + 1}, Col ${neighbor.col + 1} shows "${cellNumber}" with ${flaggedNeighborsOfSource} flags. All mines found → remaining cells safe.`,
                    sourceRow: neighbor.row,
                    sourceCol: neighbor.col
                };
            }
            
            // Rule 2: If numbered cell's number equals flags + unrevealed neighbors,
            // and there's only 1 unrevealed neighbor (our candidate), then it must be a mine
            if (cellNumber === flaggedNeighborsOfSource + unrevealedNeighborsOfSource.length && 
                unrevealedNeighborsOfSource.length === 1) {
                return { safe: false }; // This cell must be a mine
            }
        }
    }
    
    return { safe: false }; // Cannot definitively prove it's safe
}

// AI Hint System - Rule-based analysis
function getAIHint() {
    const safeCells = [];
    const checkedCells = new Set(); // Track cells we've already considered

    // First, identify candidate safe cells from numbered cells where all mines are flagged
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            // Only analyze revealed numbered cells (not empty, not mines)
            if (!revealed[i][j] || board[i][j] <= 0) {
                continue;
            }

            const cellNumber = board[i][j];
            const flaggedCount = countFlaggedNeighbors(i, j);
            const unrevealedNeighbors = getUnrevealedNeighbors(i, j);

            // Rule: If cell shows number N and has N flagged neighbors, remaining neighbors are safe
            if (cellNumber === flaggedCount && unrevealedNeighbors.length > 0) {
                for (const neighbor of unrevealedNeighbors) {
                    const cellKey = `${neighbor.row},${neighbor.col}`;
                    
                    // Skip if we've already checked this cell
                    if (checkedCells.has(cellKey)) {
                        continue;
                    }
                    checkedCells.add(cellKey);
                    
                    // Validate this cell is truly safe by checking ALL constraints
                    const safetyCheck = isCellSafe(neighbor.row, neighbor.col);
                    
                    if (safetyCheck.safe) {
                        safeCells.push({
                            row: neighbor.row,
                            col: neighbor.col,
                            reason: safetyCheck.reason,
                            sourceRow: safetyCheck.sourceRow,
                            sourceCol: safetyCheck.sourceCol,
                            category: 'Direct Deduction',
                            confidence: 'High'
                        });
                    }
                }
            }
        }
    }

    // REQUIREMENT: Select one safe cell to suggest
    if (safeCells.length > 0) {
        // Use the first safe cell found (deterministic)
        const suggestion = safeCells[0];
        // RETURN: One safe cell (row, column) with explanation string, category, and confidence
        return {
            row: suggestion.row,        // Safe cell row
            col: suggestion.col,        // Safe cell column
            explanation: suggestion.reason,  // Short explanation string
            category: suggestion.category,   // Reasoning category
            confidence: suggestion.confidence, // Confidence level
            sourceRow: suggestion.sourceRow,
            sourceCol: suggestion.sourceCol
        };
    }

    return null;
}

// ============================================================================
// LLM Explanation Layer (Groq Integration)
// ============================================================================
// This layer enhances explanations but NEVER decides moves.
// The rule-based AI (getAIHint) is the only decision maker.

/**
 * Serialize board state for LLM
 * @param {Object} hint - The AI hint object from getAIHint()
 * @returns {string} Serialized board state
 */
function serializeBoardState(hint) {
    let boardState = `Minesweeper Game State (${GRID_SIZE}x${GRID_SIZE}):\n\n`;
    boardState += `Suggested Safe Cell: Row ${hint.row + 1}, Column ${hint.col + 1}\n`;
    boardState += `Reasoning Category: ${hint.category}\n`;
    boardState += `Confidence: ${hint.confidence}\n`;
    boardState += `Original Explanation: ${hint.explanation}\n\n`;
    boardState += `Board Layout:\n`;
    
    for (let i = 0; i < GRID_SIZE; i++) {
        let row = '';
        for (let j = 0; j < GRID_SIZE; j++) {
            if (revealed[i][j]) {
                if (board[i][j] === -1) {
                    row += 'M ';
                } else if (board[i][j] === 0) {
                    row += '. ';
                } else {
                    row += board[i][j] + ' ';
                }
            } else if (flagged[i][j]) {
                row += 'F ';
            } else {
                row += '? ';
            }
        }
        boardState += row.trim() + '\n';
    }
    
    return boardState;
}

/**
 * Enhance explanation using Groq LLM
 * @param {Object} hint - The AI hint object from getAIHint()
 * @returns {Promise<string>} Enhanced explanation or original if API fails
 */
async function enhanceExplanationWithGroq(hint) {
    // Fallback if API key is missing
    if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '') {
        console.log('⚠ Groq API key not found, using local explanation');
        return hint.explanation;
    }

    try {
        const boardState = serializeBoardState(hint);
        
        const prompt = `You are explaining a Minesweeper game move to a player. The AI has already determined a safe cell to click based on logical rules.

${boardState}

Task: Rewrite the original explanation in a more natural, conversational way while:
1. Keeping the same suggested cell (Row ${hint.row + 1}, Column ${hint.col + 1})
2. Maintaining the reasoning category (${hint.category})
3. Making it sound more friendly and helpful
4. Being concise (2-3 sentences max)

Respond with ONLY the rewritten explanation text, nothing else.`;

        console.log('📡 Calling Groq API to enhance explanation...');
        const startTime = Date.now();
        
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that explains Minesweeper moves in a friendly, clear way. You only rewrite explanations - you never choose which cell to click.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const duration = Date.now() - startTime;
        console.log(`⏱ API call took ${duration}ms`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Groq API error:', response.status, errorText);
            throw new Error(`Groq API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📥 Groq API response received:', data);
        
        if (data.choices && data.choices.length > 0 && 
            data.choices[0] && data.choices[0].message && 
            data.choices[0].message.content) {
            const enhancedExplanation = data.choices[0].message.content.trim();
            if (enhancedExplanation && enhancedExplanation.length > 0) {
                console.log('✅ Enhanced explanation received:', enhancedExplanation);
                return enhancedExplanation;
            } else {
                console.warn('⚠ Groq API returned empty content in response');
            }
        } else {
            console.warn('⚠ Groq API response structure invalid:', data);
        }
        
        return hint.explanation;
    } catch (error) {
        console.error('❌ Groq API enhancement failed:', error.message || error);
        return hint.explanation;
    }
}

// ============================================================================
// AI Hint Display Logic
// ============================================================================

/**
 * Display AI hint with optional Groq enhancement
 */
async function displayAIHint() {
    // Don't show hint if game hasn't started, is over, or already won
    if (firstClick || gameOver) {
        aiPanelContent.innerHTML = '<p class="ai-placeholder">Start playing to get AI hints!</p>';
        aiPanel.classList.add('open');
        return;
    }

    const hint = getAIHint();

    if (!hint) {
        aiPanelContent.innerHTML = '<p class="ai-placeholder">No safe moves can be determined with current information. Keep exploring!</p>';
        aiPanel.classList.add('open');
        aiSuggestedCell = null;
        renderBoard();
        return;
    }

    // Store suggested cell for visual highlighting
    aiSuggestedCell = { row: hint.row, col: hint.col };

    // Show loading state while enhancing explanation
    aiPanelContent.innerHTML = `
        <div class="ai-suggestion">
            <div class="ai-suggestion-title">Suggested Safe Cell:</div>
            <div class="ai-suggestion-cell">Row ${hint.row + 1}, Column ${hint.col + 1}</div>
            <div class="ai-reasoning-info">
                <span class="ai-category ai-category-${hint.category.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-')}">${hint.category}</span>
                <span class="ai-confidence ai-confidence-${hint.confidence.toLowerCase()}">Confidence: ${hint.confidence}</span>
            </div>
            <div class="ai-explanation-text">
                <em>Enhancing explanation...</em>
            </div>
        </div>
    `;
    
    // Open panel and render board immediately
    aiPanel.classList.add('open');
    renderBoard();

    // Try to enhance explanation with Groq (non-blocking, with fallback)
    let finalExplanation = hint.explanation;
    try {
        console.log('Attempting to enhance explanation with Groq...');
        console.log('API Key present:', !!GROQ_API_KEY, 'Length:', GROQ_API_KEY ? GROQ_API_KEY.length : 0);
        
        const enhanced = await enhanceExplanationWithGroq(hint);
        console.log('Enhancement result:', enhanced);
        console.log('Original explanation:', hint.explanation);
        
        // Use enhanced explanation if we got a valid response (different from original)
        if (enhanced && enhanced.trim() && enhanced.trim() !== hint.explanation.trim()) {
            finalExplanation = enhanced.trim();
            console.log('✓ Using enhanced explanation:', finalExplanation);
        } else if (enhanced && enhanced.trim()) {
            console.log('⚠ Enhanced explanation same as original, using original');
            finalExplanation = hint.explanation;
        } else {
            console.log('⚠ No valid enhancement received, using original explanation');
            finalExplanation = hint.explanation;
        }
    } catch (error) {
        console.error('❌ Error enhancing explanation:', error);
        finalExplanation = hint.explanation;
    }
    
    console.log('Final explanation to display:', finalExplanation);

    // Display final explanation (either enhanced or original)
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // Ensure we have a valid explanation
    if (!finalExplanation || !finalExplanation.trim()) {
        finalExplanation = hint.explanation || 'No explanation available.';
        console.warn('⚠ No valid explanation found, using fallback');
    }

    const categoryClass = hint.category.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-');
    const confidenceClass = hint.confidence.toLowerCase();

    console.log('🎨 Updating AI panel with explanation:', finalExplanation);

    aiPanelContent.innerHTML = `
        <div class="ai-suggestion">
            <div class="ai-suggestion-title">Suggested Safe Cell:</div>
            <div class="ai-suggestion-cell">Row ${hint.row + 1}, Column ${hint.col + 1}</div>
            <div class="ai-reasoning-info">
                <span class="ai-category ai-category-${escapeHtml(categoryClass)}">${escapeHtml(hint.category)}</span>
                <span class="ai-confidence ai-confidence-${escapeHtml(confidenceClass)}">Confidence: ${escapeHtml(hint.confidence)}</span>
            </div>
            <div class="ai-explanation-text">
                ${escapeHtml(finalExplanation)}
            </div>
        </div>
    `;

    // Ensure the highlight is visible by scrolling if needed
    setTimeout(() => {
        const suggestedElement = document.querySelector(`.cell.ai-suggested`);
        if (suggestedElement) {
            suggestedElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }, 100);
}

// Restart button handler
restartBtn.addEventListener('click', () => {
    if (!restartBtn.disabled) {
        gameBoard.classList.remove('game-over');
        initGame();
    }
});

// AI Hint button handler - toggles the panel open/closed
aiHintBtn.addEventListener('click', () => {
    // Toggle: if panel is open, close it
    if (aiPanel.classList.contains('open')) {
        aiPanel.classList.remove('open');
        return;
    }
    
    // Panel is closed, so open it and show appropriate content
    if (firstClick) {
        // Show message if game hasn't started
        aiPanelContent.innerHTML = '<p class="ai-placeholder">Start playing to get AI hints!</p>';
        aiPanel.classList.add('open');
    } else if (gameOver) {
        // Show message if game is over
        aiPanelContent.innerHTML = '<p class="ai-placeholder">Game is over. Start a new game to get AI hints!</p>';
        aiPanel.classList.add('open');
    } else {
        // Game is in progress - show hint or message to keep exploring
        displayAIHint();
    }
});

// Close AI panel handler
aiPanelClose.addEventListener('click', () => {
    aiPanel.classList.remove('open');
});

// Menu handlers
newGameMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    // Always allow new game, even if restart button is disabled
    initGame();
});

// Exit menu item handler
const exitMenu = document.getElementById('exit-menu');
if (exitMenu) {
    exitMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close the window or show a confirmation
        if (confirm('Are you sure you want to exit?')) {
            window.close();
            // If window.close() doesn't work (some browsers block it), we can at least try
            // For web browsers, we might want to just show a message instead
            if (!window.closed) {
                alert('Please close the browser tab/window manually.');
            }
        }
    });
}

// Help menu - "How to Play" item
const howToPlayMenuItem = helpMenuDropdown.querySelector('.menu-dropdown-item');
if (howToPlayMenuItem) {
    howToPlayMenuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        helpWindow.classList.add('show');
    });
}

// Close help window handler
helpWindowClose.addEventListener('click', () => {
    helpWindow.classList.remove('show');
});

// Initialize game on page load
initGame();


