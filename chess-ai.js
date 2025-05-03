function aiMove(board) {
  let bestMove = null;
  let bestScore = -Infinity;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === 'black') {
        const moves = getValidMoves(r, c, board,false); // Pass board explicitly if needed

        for (const [mr, mc] of moves) {
          const target = board[mr][mc];

          // Simulate move on a deep clone
          const tempBoard = JSON.parse(JSON.stringify(board));
          tempBoard[mr][mc] = { ...tempBoard[r][c] }; // copy piece
          tempBoard[r][c] = null;

          // Skip move if it results in self-check
          if (isKingInCheckAfterMove(tempBoard, 'black')) continue;

          let score = 0;

          // Capture value
          if (target && target.color === 'white') {
            score += getPieceValue(target.type);
          }

          // Safe square bonus
          if(!isUnderAttack(tempBoard,r,c,'white')){
            score+=0.5;
          }

          if (score > bestScore) {
            bestScore = score;
            bestMove = { from: [r, c], to: [mr, mc] };
          }
        }
      }
    }
  }

  // Execute the best move
  if (bestMove) {
    const { from, to } = bestMove;
    const [fr, fc] = from;
    const [tr, tc] = to;

    board[tr][tc] = board[fr][fc];
    board[fr][fc] = null;

    renderBoard();
   // highlightKingInCheck('white');
    switchPlayer();
  } else {
    console.log("AI has no legal moves.");
  }
}
