// --- Global Game State ---
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = false;
let gameMode = null; // '2P' or 'VS_AI'

// SEPARATE SCORE TRACKING FOR EACH MODE
let humanVsHumanScores = { 'X': 0, 'O': 0 }; // Stores Player 1 (X) and Player 2 (O) scores
let humanVsAiScores = { 'X': 0, 'O': 0 };     // Stores You (X) and Computer (O) scores

// --- DOM Elements ---
const cells = document.querySelectorAll('.cell');
const statusMessage = document.getElementById('status-message');
const modeSelection = document.getElementById('mode-selection');
const gameBoard = document.getElementById('game-board');
const scoreXElement = document.getElementById('scoreX');
const scoreOElement = document.getElementById('scoreO');
const player1Label = document.getElementById('player1-label'); 
const player2Label = document.getElementById('player2-label');
const scorePanel = document.getElementById('score-panel');
const bottomPanel = document.getElementById('bottom-panel'); 

let pendingGameMode = null; 

// --- Winning Conditions ---
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- Initialization ---

cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

// Listener for quick restart after a match ends
gameBoard.addEventListener('click', handleBoardClick); 

updateScoreDisplay(humanVsHumanScores);

// --- HELPER FUNCTION: Get Current Scores ---
function getCurrentScores() {
    return gameMode === 'VS_AI' ? humanVsAiScores : humanVsHumanScores;
}

// --- HELPER FUNCTION: Update Score Display ---
function updateScoreDisplay(currentScores) {
    scoreXElement.textContent = currentScores['X'];
    scoreOElement.textContent = currentScores['O'];
}

// --- Game Control Functions ---

function startGame(mode) {
    
    // Save previous mode's scores before switching/restarting
    if (gameMode === 'VS_AI') {
        humanVsAiScores = getCurrentScores();
    } else if (gameMode === '2P') {
        humanVsHumanScores = getCurrentScores();
    }
    
    gameMode = mode;
    resetBoard();
    gameActive = true;
    
    // 1. SHOW elements for the SECOND PAGE
    modeSelection.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    scorePanel.classList.remove('hidden-on-start');
    bottomPanel.classList.remove('hidden-on-start');
    
    // 2. SET LABELS AND LOAD SCORES BASED ON MODE
    let currentScores;
    if (mode === 'VS_AI') {
        player1Label.textContent = 'YOU';
        player2Label.textContent = 'COMPUTER';
        currentScores = humanVsAiScores;
    } else {
        player1Label.textContent = 'PLAYER 1';
        player2Label.textContent = 'PLAYER 2';
        currentScores = humanVsHumanScores;
    }
    updateScoreDisplay(currentScores);
    
    statusMessage.textContent = "Player X's turn.";
    
    // 3. Enable Game Play and Reset Cursor
    cells.forEach(cell => cell.style.pointerEvents = 'auto');
    gameBoard.style.cursor = 'default'; 
    pendingGameMode = mode; 
}

/**
 * BACK button functionality: Resets everything and shows mode selection (FIRST PAGE).
 */
function resetGame() {
    
    // Save current scores before going back
    if (gameMode === 'VS_AI') {
        humanVsAiScores = getCurrentScores();
    } else if (gameMode === '2P') {
        humanVsHumanScores = getCurrentScores();
    }
    
    gameActive = false;
    gameMode = null;
    
    // 1. HIDE elements from the SECOND PAGE
    gameBoard.classList.add('hidden');
    scorePanel.classList.add('hidden-on-start');
    bottomPanel.classList.add('hidden-on-start');
    
    // 2. SHOW elements for the FIRST PAGE
    modeSelection.classList.remove('hidden');
    
    resetBoard();
    
    // Set labels back to default
    player1Label.textContent = 'PLAYER 1';
    player2Label.textContent = 'PLAYER 2';
}

/**
 * Resets the score to 0-0 for the CURRENT mode.
 */
function resetScores() {
    let currentScores = getCurrentScores();
    currentScores['X'] = 0;
    currentScores['O'] = 0;
    
    updateScoreDisplay(currentScores);
    
    if(gameMode !== null) {
        startGame(gameMode);
        statusMessage.textContent = "Score reset. Player X's turn.";
    } else {
        resetGame(); 
    }
}

function resetBoard() {
    board.fill('');
    currentPlayer = 'X';
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
}


// --- Function for Quick Restart ---
function handleBoardClick(event) {
    // Only restart if the game is NOT active
    if (!gameActive && gameMode !== null) {
        // Prevent accidental restarts from button clicks that bubble up
        if (event.target.id !== 'back-button' && event.target.id !== 'reset-score-button') {
            startGame(gameMode);
        }
    }
}


// --- Game Core Logic ---

function handleCellClick(event) {
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedCellIndex] !== '' || !gameActive) {
        return;
    }

    // 1. Player Move
    makeMove(clickedCellIndex, currentPlayer);
    
    // 2. Check for Win/Draw
    if (checkResult()) return;

    // 3. Switch Turn or Trigger AI
    if (gameMode === '2P') {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusMessage.textContent = `Player ${currentPlayer}'s turn.`;
    } else if (gameMode === 'VS_AI' && currentPlayer === 'X') {
        currentPlayer = 'O';
        statusMessage.textContent = "Computer is thinking...";
        setTimeout(handleAITurn, 800);
    }
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = (player === 'X' ? 'X' : 'O');
    cells[index].classList.add(player.toLowerCase());
}

function checkResult() {
    let roundWon = false;
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        let currentScores = getCurrentScores();
        currentScores[currentPlayer] += 1; 
        updateScoreDisplay(currentScores);       
        
        let winnerName;
        if (currentPlayer === 'X') {
            winnerName = gameMode === 'VS_AI' ? 'You (X)' : 'Player 1 (X)';
        } else {
            winnerName = gameMode === 'VS_AI' ? 'Computer (O)' : 'Player 2 (O)';
        }
        
        endGame(`${winnerName} Wins!`);
        return true;
    }

    if (!board.includes('')) {
        endGame("It's a Draw!");
        return true;
    }
    
    if (gameMode === 'VS_AI' && currentPlayer === 'O') {
        currentPlayer = 'X';
        statusMessage.textContent = `Player X's turn.`;
    }

    return false;
}

/**
 * Handles the end of a game. Freezes the board and displays the result.
 */
function endGame(message) {
    gameActive = false;
    
    statusMessage.textContent = message + " Click the board to play again.";
    
    // CRITICAL: Disable pointer events on cells so the 'handleBoardClick' listener can fire on the board container.
    cells.forEach(cell => cell.style.pointerEvents = 'none');
    
    // Add visual cue for restart
    gameBoard.style.cursor = 'pointer'; 
}


// --- AI Logic ---
function handleAITurn() {
    if (!gameActive || currentPlayer !== 'O') return;

    const availableSpots = board.map((val, index) => val === '' ? index : null).filter(val => val !== null);
    
    let bestMove = -1;
    
    // 1. Check for immediate win (AI is 'O')
    for (let i of availableSpots) {
        const tempBoard = [...board];
        tempBoard[i] = 'O';
        if (checkWin(tempBoard, 'O')) {
            bestMove = i;
            break;
        }
    }

    // 2. Check to block opponent's win (Opponent is 'X')
    if (bestMove === -1) {
        for (let i of availableSpots) {
            const tempBoard = [...board];
            tempBoard[i] = 'X';
            if (checkWin(tempBoard, 'X')) {
                bestMove = i;
                break;
            }
        }
    }
    
    // 3. Take center or corner
    if (bestMove === -1) {
        if (availableSpots.includes(4)) {
            bestMove = 4;
        } else {
            const corners = [0, 2, 6, 8].filter(i => availableSpots.includes(i));
            if (corners.length > 0) {
                bestMove = corners[Math.floor(Math.random() * corners.length)];
            }
        }
    }

    // 4. Take any available move
    if (bestMove === -1 && availableSpots.length > 0) {
        bestMove = availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    if (bestMove !== -1) {
        makeMove(bestMove, 'O');
        
        if (checkResult()) return;
    }
}

function checkWin(currentBoard, player) {
    return winConditions.some(condition => {
        return condition.every(index => {
            return currentBoard[index] === player;
        });
    });
}