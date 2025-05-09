import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService, Piece } from '../services/game-state.service';

type Tile = {
  row: number;
  col: number;
  color: 'black' | 'white';
  piece: Piece;
  owner: 'white' | 'black' | null;
};

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
  imports: [CommonModule],
})
export class ChessBoardComponent{
  constructor(public game: GameStateService) {}

  getTileColor(row: number, col: number): string {
    return (row + col) % 2 === 0 ? 'white' : 'black';
  }

  getTileClass(rowIndex: number, colIndex: number): string {
    return (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black';
  }

  getImagePath(rowIndex: number, colIndex: number): string | null {

    const piece = this.game.board[rowIndex][colIndex];

    if(!piece) return null;

    const pieceType = piece.type;
    const pieceColor = piece.player === 'white' ? 'w' : 'b';

    const pieceKey = `${pieceColor}${pieceType[0].toUpperCase()}`;

    return piece ? `assets/pieces/${pieceKey}.svg` : null;
  }

  activateTile(rowIndex: number, colIndex: number): void {

    const selected = this.game.selectedPiece;
    const isMove = this.game.validMoves.some(m => m.row === rowIndex && m.col === colIndex);

    if (selected && isMove) {
      this.game.movePiece(rowIndex, colIndex);
    } else {
      this.game.selectPiece(rowIndex, colIndex);
    }

  }
}


