import { Injectable } from '@angular/core';

export type Player = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export interface Piece {
  type: PieceType;
  player: Player;
  hasMoved?: boolean; // for castling, en passant
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  board: (Piece | null)[][] = [];
  currentPlayer: Player = 'white';
  selectedPiece: { row: number; col: number } | null = null;
  validMoves: { row: number; col: number }[] = [];

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

    const { row, col } = this.selectedPiece;
    const piece = this.board[row][col];
    if (!piece) return;

    const isValid = this.validMoves.some(m => m.row === targetRow && m.col === targetCol);
    if (!isValid) return;

    // Move piece
    this.board[targetRow][targetCol] = { ...piece, hasMoved: true };
    this.board[row][col] = null;

    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.selectedPiece = null;
    this.validMoves = [];
  }

  private calculateValidMoves(row: number, col: number): { row: number; col: number }[] {
    const piece = this.board[row][col];
    if (!piece) return [];

    const moves: { row: number; col: number }[] = [];

    if (piece.type === 'pawn') {
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
        if (target && target.player !== piece.player) {
          moves.push({ row: nextRow, col: captureCol });
        }
      }
    }

    // Add other piece logic here (rook, bishop, etc.)

    return moves.filter(({ row, col }) => this.inBounds(row, col));
  }

  private inBounds(row: number, col: number) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
}
