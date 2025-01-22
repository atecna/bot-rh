/**
 * Utilitaire pour mesurer et logger le temps d'exécution des opérations
 */
export class OperationTimer {
  private startTime: number;
  private lastTime: number;

  constructor() {
    this.startTime = Date.now();
    this.lastTime = this.startTime;
  }

  /**
   * Enregistre et affiche le temps écoulé depuis la dernière opération
   * @param message - Message à logger avec le timing
   */
  log(message: string): void {
    const now = Date.now();
    console.log(
      `[+${now - this.lastTime}ms (total: ${now - this.startTime}ms)] ${message}`
    );
    this.lastTime = now;
  }

  /**
   * Réinitialise le timer
   */
  reset(): void {
    this.startTime = Date.now();
    this.lastTime = this.startTime;
  }

  /**
   * Retourne le temps total écoulé en ms
   */
  getTotalTime(): number {
    return Date.now() - this.startTime;
  }
} 