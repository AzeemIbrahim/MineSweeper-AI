// Minesweeper Game Logic

// Game configuration
const GRID_SIZE = 8;
const MINE_COUNT = 10;

// Game state
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

// AI Hint System - Rule-based analysis
function getAIHint() {
    const safeCells = [];
    let explanation = '';

    // Scan all revealed numbered cells
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            // Only analyze revealed numbered cells (not empty, not mines)
            if (!revealed[i][j] || board[i][j] <= 0) {
                continue;
            }

            const cellNumber = board[i][j];
            const flaggedCount = countFlaggedNeighbors(i, j);
            const unrevealedNeighbors = getUnrevealedNeighbors(i, j);
            const unrevealedCount = unrevealedNeighbors.length;

            // Rule 1: Safe Cell Detection
            // Logic: If cell shows number N and has N flagged neighbors, all remaining neighbors are safe
            // Example: Cell shows "2" and 2 neighbors are flagged → remaining neighbors are safe
            if (cellNumber === flaggedCount && unrevealedCount > 0) {
                for (const neighbor of unrevealedNeighbors) {
                    // Only suggest if cell is truly unrevealed and not flagged
                    if (!revealed[neighbor.row][neighbor.col] && !flagged[neighbor.row][neighbor.col]) {
                        safeCells.push({
                            row: neighbor.row,
                            col: neighbor.col,
                            reason: `Row ${i + 1}, Col ${j + 1} shows "${cellNumber}" with ${flaggedCount} flags. All mines found → remaining cells safe.`,
                            sourceRow: i,
                            sourceCol: j,
                            category: 'Direct Deduction',
                            confidence: 'High'
                        });
                    }
                }
            }

            // Rule 2: If number equals unrevealed neighbors, all unrevealed are mines
            // This helps identify which cells are NOT safe, but we focus on finding safe cells
            // So we use this rule indirectly - if all neighbors except one are flagged/unrevealed and number matches, 
            // the remaining one is safe (but this is covered by Rule 1)
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

// Display AI hint
function displayAIHint() {
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

    // REQUIREMENT 1: Store suggested cell (row, column) for visual highlighting
    aiSuggestedCell = { row: hint.row, col: hint.col };

    // REQUIREMENT 4: Display explanation in side panel
    // REQUIREMENT 2: Show row, column, explanation string, category, and confidence
    aiPanelContent.innerHTML = `
        <div class="ai-suggestion">
            <div class="ai-suggestion-title">Suggested Safe Cell:</div>
            <div class="ai-suggestion-cell">Row ${hint.row + 1}, Column ${hint.col + 1}</div>
            <div class="ai-reasoning-info">
                <span class="ai-category ai-category-${hint.category.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-')}">${hint.category}</span>
                <span class="ai-confidence ai-confidence-${hint.confidence.toLowerCase()}">Confidence: ${hint.confidence}</span>
            </div>
            <div class="ai-explanation-text">
                ${hint.explanation}
            </div>
        </div>
    `;

    // REQUIREMENT 3: Re-render board to highlight the suggested cell visually
    renderBoard();

    // Open the side panel after rendering to ensure cell is highlighted
    aiPanel.classList.add('open');
    
    // Ensure the highlight is visible by scrolling if needed (small delay to ensure render completes)
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

// AI Hint button handler
aiHintBtn.addEventListener('click', () => {
    if (!gameOver && !firstClick) {
        displayAIHint();
    } else if (firstClick) {
        // Show message if game hasn't started
        aiPanelContent.innerHTML = '<p class="ai-placeholder">Start playing to get AI hints!</p>';
        aiPanel.classList.add('open');
    } else if (gameOver) {
        // Show message if game is over
        aiPanelContent.innerHTML = '<p class="ai-placeholder">Game is over. Start a new game to get AI hints!</p>';
        aiPanel.classList.add('open');
    }
});

// Close AI panel handler
aiPanelClose.addEventListener('click', () => {
    aiPanel.classList.remove('open');
});

// Initialize game on page load
initGame();


