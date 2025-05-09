import { Injectable } from '@angular/core';

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

    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.selectedPiece = null;
    this.validMoves = [];
  }

  trackEnPassant(from: Position, to: Position, piece: Piece): void {

    if(piece.type !== 'pawn'){
      this.enPassantSquare = null;
      return;
    }

    const enPassantPawnRow = piece.player === 'white' ? 4 : 3;
    const enPassantCaptureRow = piece.player === 'white' ? 5 : 2;

    if (
      (piece.player === 'white' && from.row === 6 && to.row === 4) ||
      (piece.player === 'black' && from.row === 1 && to.row === 3)
    ) {
      // Mark square behind pawn
      this.enPassantSquare = {
        row: enPassantCaptureRow,
        col: from.col
      };
    } else {
      this.enPassantSquare = null;
    }
  }

  private calculateValidMoves(row: number, col: number): { row: number; col: number }[] {
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
          break;
        case 'knight':
          this.addStepMoves(piece, row, col, moves, [
            [2, 1], [1, 2], [-1, 2], [-2, 1],
            [-2, -1], [-1, -2], [1, -2], [2, -1]
          ]);
          break;
      }
      
      

    // Add other piece logic here (rook, bishop, etc.)

    return moves.filter(({ row, col }) => this.inBounds(row, col));
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
