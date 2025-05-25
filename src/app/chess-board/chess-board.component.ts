import { Component, effect, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService, Piece, PieceType, Player } from '../services/game-state.service';


@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
  imports: [CommonModule],
})
export class ChessBoardComponent {
  showPromotionModal = false;
  promotionPlayer: Player | null = null;
  get promotionPrefix(): string | null {
    if (!this.promotionPlayer) return null;
    return this.promotionPlayer === 'white' ? 'w' : 'b';
  }
  promotionDetails: { row: number; col: number; player: Player } | null = null;
  promotionChoices: PieceType[] = ['knight', 'bishop', 'rook', 'queen'];

  typeToPrefix: Record<PieceType, string> = {
    pawn: 'P',
    knight: 'N',
    bishop: 'B',
    rook: 'R',
    queen: 'Q',
    king: 'K',
  };

  constructor(public game: GameStateService) {
    effect(() => {
      const promo = this.game.promotionPending();
      if (promo) {
        this.promotionPlayer = promo.player;
        this.showPromotionModal = true;
      }
    });
  }

  onPromotionSelected(pieceType: PieceType) {
    this.game.promotePawn(pieceType);
    this.showPromotionModal = false;
    this.promotionDetails = null;
  }

  getTileColor(row: number, col: number): string {
    return (row + col) % 2 === 0 ? 'white' : 'black';
  }

  getTileClass(rowIndex: number, colIndex: number): string {
    return (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black';
  }

  getImagePath(rowIndex: number, colIndex: number): string | null {

    const piece = this.game.board[rowIndex][colIndex];

    if (!piece) return null;

    const pieceType = piece.type;
    const pieceColor = piece.player === 'white' ? 'w' : 'b';


    const keyId = pieceType === 'knight' ? 'N' : pieceType[0].toUpperCase();
    const pieceKey = `${pieceColor}${keyId}`;

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

  isValidMove(rowIndex: number, colIndex: number): boolean {
    return this.game?.validMoves?.some(m => m.row === rowIndex && m.col === colIndex) ?? false;
  }

  isCheckedKing(rowIndex: number, colIndex: number): boolean {
    const piece = this.game.board[rowIndex][colIndex];
    if (!piece || piece.type !== 'king') return false;
    if (this.game.isInCheck(piece.player)) return true;
    return false;
  }
}