# Sakushi Planning Studio

Éditeur responsive du planning « planning deux.psd ». Le fond, les jaquettes initiales et le dialogue initial sont extraits du PSD fourni. La police Determination Mono provient du Mac de l’utilisateur.

- Deux lives : jour, horaire, couleur, recherche Steam, import d’image et cadrage.
- Dialogue Undertale/Deltarune : personnages, expressions et texte, rendu par le moteur utilisé par [undertale-text-box-generator](https://github.com/ImSakushi/undertale-text-box-generator).
- Aperçu et export PNG 1280 × 720 à partir du même canvas, partage natif si disponible.
- Brouillon local au navigateur, export/import JSON pour changer d’appareil. Aucune synchronisation cloud des brouillons.

## Développement

Node.js 22.13 ou plus récent. `npm ci`, puis `npm run dev`.
Validation : `npx tsc --noEmit` et `npm run build`.

Les routes serveur fixent les domaines Steam et Demirramon. Aucune clé API n’est requise. La recherche et la génération de dialogues nécessitent leurs services externes ; les erreurs empêchent d’exporter un dialogue obsolète. Le fichier PSD source n’est pas publié.

## Fidélité

Plan de travail 1280 × 720. Dialogue : (351,45), 578 × 152. Cadres des jaquettes : (321,357) et (721,357), 260 × 344, bord blanc de 5 pixels. Horaires : Determination Mono 32 px. Réponse : 27 px. Le rendu des glyphes peut varier légèrement selon le moteur de canvas du navigateur par rapport à l’anticrénelage de Photoshop.

Les ressources Undertale/Deltarune et les jaquettes appartiennent à leurs auteurs respectifs. Intégration basée sur le projet d’ImSakushi et le générateur de Demirramon.
