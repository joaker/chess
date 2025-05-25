import { Injectable, signal } from '@angular/core';

export type Player = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export interface Piece {
  type: PieceType;
  player: Player;
  hasMoved?: boolean; // for castling, en passant
}

interface Position {
  row: number;
  col: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  board: (Piece | null)[][] = [];
  currentPlayer: Player = 'white';
  selectedPiece: Position | null = null;
  validMoves: { row: number; col: number }[] = [];
  enPassantSquare: Position | null = null;



  promotionPending = signal<{ position: Position; player: Player } | null>(null);


  constructor() {
    this.resetBoard();
  }

  resetBoard() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));

    const place = (row: number, player: Player) => {
      this.board[row] = [
        { type: 'rook', player },
        { type: 'knight', player },
        { type: 'bishop', player },
        { type: 'queen', player },
        { type: 'king', player },
        { type: 'bishop', player },
        { type: 'knight', player },
        { type: 'rook', player }
      ];
    };

    place(0, 'black');
    place(7, 'white');

    for (let col = 0; col < 8; col++) {
      this.board[1][col] = { type: 'pawn', player: 'black' };
      this.board[6][col] = { type: 'pawn', player: 'white' };
    }
  }

  selectPiece(row: number, col: number) {
    const piece = this.board[row][col];
    if (!piece || piece.player !== this.currentPlayer) {
      this.selectedPiece = null;
      this.validMoves = [];
      return;
    }

    this.selectedPiece = { row, col };
    this.validMoves = this.calculateValidMoves(row, col);
  }

  movePiece(targetRow: number, targetCol: number) {
    if (!this.selectedPiece) return;

    const from = this.selectedPiece;
    const to = { row: targetRow, col: targetCol };

    const { row, col } = this.selectedPiece;
    const piece = this.board[row][col];
    if (!piece) return;

    const isValid = this.validMoves.some(m => m.row === targetRow && m.col === targetCol);
    if (!isValid) return;

    // Move piece

    if (this.isEnPassantCapture(from, to)) {
      const capturedRow = this.currentPlayer == 'white' ? targetRow + 1 : targetRow - 1;
      this.board[capturedRow][targetCol] = null;
    }

    this.board[targetRow][targetCol] = { ...piece, hasMoved: true };
    this.board[row][col] = null;

    this.trackEnPassant(from, to, piece)
    this.trackPawnPromotion(from, to, piece);

    // 🏰 Castling detection
    const isKing = piece.type === 'king';
    const isKingsideCastle = isKing && col === 4 && to.col === 6;
    const isQueensideCastle = isKing && col === 4 && to.col === 2;

    // 🏰 Move rook during castling
    if (isKingsideCastle || isQueensideCastle) {
      const rookStartCol = isKingsideCastle ? 7 : 0;
      const rookEndCol = isKingsideCastle ? 5 : 3;
      const rook = this.board[targetRow][rookStartCol];

      if (rook && rook.type === 'rook') {
        this.board[targetRow][rookEndCol] = { ...rook, hasMoved: true };
        this.board[targetRow][rookStartCol] = null;
      }
    }

    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.selectedPiece = null;
    this.validMoves = [];


    if (this.isCheckmate(this.currentPlayer)) {
      console.log(`${this.currentPlayer} is in checkmate!`);
      // Handle checkmate logic here
      return;
    }

    if(this.isStalemate(this.currentPlayer)) {
      console.log(`${this.currentPlayer} is in stalemate!`);
      // Handle stalemate logic here
    }

    if (this.isInCheck(this.currentPlayer)) {
      console.log(`${this.currentPlayer} is in check!`);
      // Handle check logic here
      return;
    }

  }

  trackPawnPromotion(from: Position, to: Position, piece: Piece): void {

    const promotionRow = piece.player === 'white' ? 0 : 7;
    // const promotionRow = piece.player === 'white' ? 4 : 3; // useful for testing promotions

    const isPromotion = piece.type === 'pawn' && to.row === promotionRow;

    if (isPromotion) {
      this.promotionPending.set({ position: { ...to }, player: piece.player });
      return; // stop here and wait for UI to call promotePawn()
    }
    this.promotionPending.set(null);
  }

  promotePawn(type: PieceType) {
    const promotion = this.promotionPending();
  
    // If no promotion is pending, exit early
    if (!promotion) return;
  
    // Destructure the target position from the promotion object
    const { row, col } = promotion.position;
    const piece = this.board[row][col];
  
    // Ensure there's a pawn at the promotion square before continuing
    if (!piece || piece.type !== 'pawn') return;
  
    // Replace the pawn with the selected piece type, preserving player ownership
    this.board[row][col] = {
      type,
      player: piece.player,
      hasMoved: true
    };
  
    // Clear the promotion signal so UI and logic can proceed
    this.promotionPending.set(null);
  
  }
  

  trackEnPassant(from: Position, to: Position, piece: Piece): void {

    if(piece.type !== 'pawn'){
      this.enPassantSquare = null;
      return;
    }

    const initialPawnRow = piece.player === 'white' ? 6 : 1;
    const enPassantCaptureRow = piece.player === 'white' ? 5 : 2;
    const enPassantPawnRow = piece.player === 'white' ? 4 : 3;

    if (from.row === initialPawnRow && to.row === enPassantPawnRow) {
      // Mark square behind pawn as en passant capture target
      this.enPassantSquare = {
        row: enPassantCaptureRow,
        col: from.col
      };
    } else {
      this.enPassantSquare = null;
    }
  }

  private isStalemate(player: Player): boolean {
    if (this.isInCheck(player)) return false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece?.player === player) {
          const legalMoves = this.calculateValidMoves(r, c);
          if (legalMoves.length > 0) return false;
        }
      
      
      }
    }
    return true;
  }



  private isCheckmate(player: Player): boolean {
    if (!this.isInCheck(player)) return false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece?.player === player) {
          const legalMoves = this.calculateValidMoves(r, c);
          if (legalMoves.length > 0) return false;
        }
      }
    }
    return true;
  }

  public isInCheck(player: Player): boolean {
    const kingPos = this.findKing(player);
    if (!kingPos) return false;
  
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.player !== player) {
          const enemyMoves = this.calculateValidMoves(r, c, true); // allow unsafe
          if (enemyMoves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
            return true;
          }
        }
      }
    }
  
    return false;
  }
  
  private findKing(player: Player): Position | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece?.type === 'king' && piece.player === player) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }
  

  public calculateValidMoves(row: number, col: number, ignoreKingSafety = false): Position[] {
    const piece = this.board[row][col];
    if (!piece) return [];

    const moves: { row: number; col: number }[] = [];

    switch (piece.type) {
        case 'pawn':
          this.addPawnMoves(piece, row, col, moves);
          break;
        case 'rook':
          this.addSlidingMoves(piece, row, col, moves, [
            [1, 0], [-1, 0], [0, 1], [0, -1]
          ]);
          break;
        case 'bishop':
          this.addSlidingMoves(piece, row, col, moves, [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
          ]);
          break;
        case 'queen':
          this.addSlidingMoves(piece, row, col, moves, [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
          ]);
          break;
        case 'king':
          this.addStepMoves(piece, row, col, moves, [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
          ]);
          if (!ignoreKingSafety) { // don't check castling if ignoring king safety to avoid infinite loop
            this.addCastlingMoves(piece, row, col, moves);
          }
          break;
        case 'knight':
          this.addStepMoves(piece, row, col, moves, [
            [2, 1], [1, 2], [-1, 2], [-2, 1],
            [-2, -1], [-1, -2], [1, -2], [2, -1]
          ]);
          break;
    }
      
    const filteredMoves =  moves.filter(({ row, col }) => this.inBounds(row, col));

    if(ignoreKingSafety) return filteredMoves;

    // Filter out moves that would leave the king in check
    return filteredMoves.filter(move => {
      const simulated = this.simulateMove({ from: { row, col }, to: move });
      return !simulated.isInCheck;
    });
  }

  private simulateMove(move: { from: Position; to: Position }) {
    const { from, to } = move;
    const backup = JSON.parse(JSON.stringify(this.board));
    const piece = this.board[from.row][from.col];

    if (!piece) return { isInCheck: false };

    const captured = this.board[to.row][to.col];
  
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
  
    const inCheck = this.isInCheck(piece!.player);
  
    this.board = backup; // restore board
    return { isInCheck: inCheck };
  }

  private canCastle(player: Player, side: 'kingside' | 'queenside'): boolean {
    const row = player === 'white' ? 7 : 0;
    const kingCol = 4;
  
    // No castling if king is in check
    if (this.isInCheck(player)) return false;

    // No castling if king has moved
    if (this.board[row][kingCol]?.hasMoved) return false;
  

    // No castling if the rook has moved
    const rookCol = side === 'kingside' ? 7 : 0;
    const rook = this.board[row][rookCol];
    if (!rook || rook.type !== 'rook' || rook.player !== player || rook.hasMoved) return false;
  
    // No castling if the path is blocked by pieces
    const pathCols = side === 'kingside' ? [5, 6] : [1, 2, 3];
    for (let col of pathCols) {
      if (this.board[row][col] !== null) return false;
    }
  
    // No castling if the king would move through check
    const dangerCols = side === 'kingside' ? [4, 5, 6] : [4, 3, 2];
    for (let col of dangerCols) {
      const sim = this.simulateMove({ from: { row, col: 4 }, to: { row, col } });
      if (sim.isInCheck) return false;
    }
  
    return true;
  }
  

  private addCastlingMoves(piece: Piece, row: number, col: number, moves: Position[]) {
    if (piece.hasMoved || this.isInCheck(piece.player)) return;
  
    const backRank = piece.player === 'white' ? 7 : 0;
  
    const canCastleKingside = this.canCastle(piece.player, 'kingside');
    const canCastleQueenside = this.canCastle(piece.player, 'queenside');
  
    if (canCastleKingside) {
      moves.push({ row: backRank, col: 6 }); // g1/g8
    }
  
    if (canCastleQueenside) {
      moves.push({ row: backRank, col: 2 }); // c1/c8
    }
  }

  private addSlidingMoves(
    piece: Piece,
    row: number,
    col: number,
    moves: { row: number; col: number }[],
    directions: [number, number][]
  ) {
    for (let [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
  
      while (this.inBounds(r, c)) {
        const target = this.board[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (target.player !== piece.player) {
            moves.push({ row: r, col: c });
          }
          break; // blocked
        }
        r += dr;
        c += dc;
      }
    }
  }

  private isEnPassantCapture(from: Position, to: Position): boolean {
    const piece = this.board[from.row][from.col];
    const notAPawn = piece?.type !== 'pawn';
    const hasActiveEnPassant = !!this.enPassantSquare;
    if (notAPawn || !hasActiveEnPassant) return false;

    
    const epRow = this.enPassantSquare?.row ?? -1;
    const epColumn = this.enPassantSquare?.col ?? -1;

    const targettingEnPassantSquare = to.row === epRow && to.col === epColumn;

    return targettingEnPassantSquare;
  }
  
  private addStepMoves(
    piece: Piece,
    row: number,
    col: number,
    moves: { row: number; col: number }[],
    deltas: [number, number][]
  ) {
    for (let [dr, dc] of deltas) {
      const r = row + dr;
      const c = col + dc;
      if (!this.inBounds(r, c)) continue;
  
      const target = this.board[r][c];
      if (!target || target.player !== piece.player) {
        moves.push({ row: r, col: c });
      }
    }
  }

  private addPawnMoves(
    piece: Piece,
    row: number,
    col: number,
    moves: { row: number; col: number }[]
  ) {
    const dir = piece.player === 'white' ? -1 : 1;
    const nextRow = row + dir;
    if (this.inBounds(nextRow, col) && this.board[nextRow][col] === null) {
      moves.push({ row: nextRow, col });
      // first move 2-step
      if (!piece.hasMoved && this.board[nextRow + dir]?.[col] === null) {
        moves.push({ row: nextRow + dir, col });
      }
    }
    // capture
    for (let dc of [-1, 1]) {
      const captureCol = col + dc;
      const target = this.board[nextRow]?.[captureCol];

      const hasNormalCapture =  target && target.player !== piece.player;
      const hasEnPassantCapture = this.enPassantSquare && this.enPassantSquare.row === nextRow && this.enPassantSquare.col === captureCol;
      if (hasNormalCapture || hasEnPassantCapture) {
        moves.push({ row: nextRow, col: captureCol });
      }
    }
  }
  

  private inBounds(row: number, col: number) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
}
