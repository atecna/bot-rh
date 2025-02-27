/**
 * Copie un texte dans le presse-papier
 * @param text Le texte à copier
 * @returns Une promesse qui se résout lorsque la copie est terminée
 */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Texte copié avec succès');
    })
    .catch(err => {
      console.error('Erreur lors de la copie:', err);
    });
} 