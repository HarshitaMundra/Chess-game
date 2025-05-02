let board = [];
let selected = null;
let currentPlayer = 'white';
let mode = '2p'; // '2p' or 'ai'
const boardEl = document.getElementById('chessboard');
let isAITurn = false;

const pieces = {
  white: {
    king: '♔', queen: '♕', rook: '♖',
    bishop: '♗', knight: '♘', pawn: '♙'
  },
  black: {
    king: '♚', queen: '♛', rook: '♜',
    bishop: '♝', knight: '♞', pawn: '♟'
  }
};

function startGame(gameMode) {
  mode = gameMode;
  document.getElementById('menu').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  initBoard();
  renderBoard();
  currentPlayer = 'white';
  isAITurn = false;
}

function initBoard() {
  board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: backRank[i], color: 'black' };
    board[1][i] = { type: 'pawn', color: 'black' };
    board[6][i] = { type: 'pawn', color: 'white' };
    board[7][i] = { type: backRank[i], color: 'white' };
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
      square.dataset.row = row;
      square.dataset.col = col;
      const piece = board[row][col];
      if (piece) square.textContent = pieces[piece.color][piece.type];

      // Only allow interaction with current player's pieces
      square.onclick = () => {
        if (mode === 'ai' && currentPlayer === 'black') return;
        handleClick(row, col);
      };

      boardEl.appendChild(square);
    }
  }
}

function handleClick(row, col) {
  const piece = board[row][col];

  // Selection
  if (selected) {
    const [sr, sc] = selected;
    const validMoves = getValidMoves(sr, sc);
    const isValid = validMoves.some(m => m[0] === row && m[1] === col);

    if (isValid) {
      // Move piece
      board[row][col] = board[sr][sc];
      board[sr][sc] = null;
      selected = null;
      renderBoard();
      switchPlayer();
    } else {
      selected = null;
      renderBoard();
    }
  } else if (piece && piece.color === currentPlayer) {
    selected = [row, col];
    renderBoard();
    const moves = getValidMoves(row, col);
    highlightMoves(moves);
    document.querySelector(`[data-row='${row}'][data-col='${col}']`).classList.add('selected');
  }
}
// 1. Add the helper functions for check and checkmate detection here

// Function to check if the king is in check
function isKingInCheck(color) {
  const kingPos = findKingPosition(color);
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        const validMoves = getValidMoves(r, c);
        if (validMoves.some(m => m[0] === kingPos[0] && m[1] === kingPos[1])) {
          return true; // The king is in check
        }
      }
    }
  }
  return false; // The king is not in check
}

// Function to find the position of a player's king
function findKingPosition(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color && piece.type === 'king') {
        return [r, c]; // Return the king's position
      }
    }
  }
  return null;
}

// Function to check for checkmate
function isCheckmate() {
  if (!isKingInCheck(currentPlayer)) return false; // No checkmate if the king is not in check

  // Check if there are any valid moves that can get the player out of check
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === currentPlayer) {
        const validMoves = getValidMoves(r, c);
        for (const [moveR, moveC] of validMoves) {
          // Simulate the move and check if it stops the check
          const tempBoard = JSON.parse(JSON.stringify(board));
          tempBoard[moveR][moveC] = tempBoard[r][c];
          tempBoard[r][c] = null;

          if (!isKingInCheckAfterMove(tempBoard, currentPlayer)) {
            return false; // There's a valid move that removes check, so not checkmate
          }
        }
      }
    }
  }
  return true; // No valid moves to remove check, it's checkmate
}

// Function to check if the king is in check after a hypothetical move
function isKingInCheckAfterMove(tempBoard, color) {
  const kingPos = findKingPosition(color);
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = tempBoard[r][c];
      if (piece && piece.color === opponentColor) {
        const validMoves = getValidMovesForBoard(r, c, tempBoard);
        if (validMoves.some(m => m[0] === kingPos[0] && m[1] === kingPos[1])) {
          return true; // The king is still in check after the move
        }
      }
    }
  }
  return false; // The king is not in check
}

// Function to get valid moves for a piece on a specific board state (used for checking check after a move)
function getValidMoves(r, c, boardState = board, checkSafety = true) {
  const piece = boardState[r][c];
  if (!piece) return [];

  const moves = [];
  const dir = piece.color === 'white' ? -1 : 1;

  const inBounds = (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8;
  const isEnemy = (x, y) => boardState[x][y] && boardState[x][y].color !== piece.color;

  const add = (x, y) => {
    if (inBounds(x, y) && (!boardState[x][y] || isEnemy(x, y))) moves.push([x, y]);
  };

  if (piece.type === 'pawn') {
    if (inBounds(r + dir, c) && !boardState[r + dir][c]) moves.push([r + dir, c]);
    if ((piece.color === 'white' && r === 6) || (piece.color === 'black' && r === 1)) {
      if (!boardState[r + dir][c] && !boardState[r + 2 * dir][c]) moves.push([r + 2 * dir, c]);
    }
    if (inBounds(r + dir, c - 1) && isEnemy(r + dir, c - 1)) moves.push([r + dir, c - 1]);
    if (inBounds(r + dir, c + 1) && isEnemy(r + dir, c + 1)) moves.push([r + dir, c + 1]);
  }

  if (piece.type === 'rook' || piece.type === 'queen') {
    for (let [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (!inBounds(nr, nc)) break;
        if (!boardState[nr][nc]) moves.push([nr, nc]);
        else {
          if (isEnemy(nr, nc)) moves.push([nr, nc]);
          break;
        }
      }
    }
  }

  if (piece.type === 'bishop' || piece.type === 'queen') {
    for (let [dr, dc] of [[1,1],[1,-1],[-1,-1],[-1,1]]) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (!inBounds(nr, nc)) break;
        if (!boardState[nr][nc]) moves.push([nr, nc]);
        else {
          if (isEnemy(nr, nc)) moves.push([nr, nc]);
          break;
        }
      }
    }
  }

  if (piece.type === 'knight') {
    for (let [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      add(r + dr, c + dc);
    }
  }

  if (piece.type === 'king') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) add(r + dr, c + dc);
      }
    }
  }

  let possibleMoves = [...moves];

  if (checkSafety) {
    // Filter out moves that would leave the king in check
    possibleMoves = moves.filter(([mr, mc]) => {
      const temp = JSON.parse(JSON.stringify(boardState));
      temp[mr][mc] = temp[r][c];
      temp[r][c] = null;
      return !isKingInCheckAfterMove(temp, piece.color);
    });
  }

  return possibleMoves;
}


// 2. Now, you can place your `switchPlayer` function after the helper functions

function switchPlayer() {
  if (isCheckmate()) {
    alert(`${currentPlayer} is in checkmate!`);
    return; // End the game when checkmate occurs
  }

  currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
  
  if (mode === 'ai' && currentPlayer === 'black') {
    isAITurn = true;
    setTimeout(() => {
      aiMove(board);
      currentPlayer = 'white';
      renderBoard();
    }, 500);
  }
}



function highlightMoves(moves) {
  moves.forEach(([r, c]) => {
    const el = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (el) el.classList.add('valid-move');
  });
}



function getPieceValue(type) {
  switch (type) {
    case 'pawn': return 1;
    case 'knight':
    case 'bishop': return 3;
    case 'rook': return 5;
    case 'queen': return 9;
    case 'king': return 100; // rarely captured, but for completeness
    default: return 0;
  }
}


function findKingPosition(color, boardState = board) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardState[r][c];
      if (piece && piece.type === 'king' && piece.color === color) {
        return [r, c];
      }
    }
  }
  return null;
}

function isUnderAttack(boardState, r, c, color) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = boardState[i][j];
      if (piece && piece.color !== color) {
        const moves = getValidMoves(i, j, boardState, false); // avoid recursion
        if (moves.some(m => m[0] === r && m[1] === c)) {
          return true;
        }
      }
    }
  }
  return false;
}

