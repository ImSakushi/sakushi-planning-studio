# Sakushi Planning Studio

Créateur de planning de streams fidèle au PSD de Sakushi, accessible sur ordinateur et téléphone.

**Site : https://imsakushi.github.io/sakushi-planning-studio/**

- Deux lives par défaut, avec un troisième live optionnel : jour, heure, couleur, recherche de jeu, import de jaquette et recadrage. Les trois colonnes reprennent les positions du second PSD.
- Dialogue Undertale/Deltarune : 59 personnages, 1 012 expressions, génération locale.
- Réponse centrée sur une à trois lignes.
- Aperçu et PNG 1280 × 720 produits par le même canvas. Partage natif si disponible.
- Brouillon enregistré sur l’appareil, export/import JSON pour changer de navigateur ou de téléphone.

## Hébergement

Le site fonctionne entièrement dans le navigateur et se déploie sur **GitHub Pages**. Aucun serveur applicatif, compte de connexion ou secret n’est nécessaire. Les textes et les images importées ne quittent pas l’appareil.

La recherche charge un catalogue local de jeux et DLC Steam. Les jaquettes sont téléchargées directement depuis le CDN Steam, avec CORS pour permettre leur export. Si une jaquette n’est pas disponible, l’import d’image reste possible. Les personnages, polices et décors sont inclus dans le site ; la génération du dialogue ne dépend pas du serveur de Demirramon.

Le workflow `.github/workflows/pages.yml` publie automatiquement chaque push sur `main` et peut être lancé manuellement depuis GitHub Actions. Il essaie de mettre à jour le catalogue à chaque déploiement et conserve l’instantané inclus si la source est indisponible.

## Développement

Node.js 24 recommandé.

```sh
npm ci
npm run dev
```

```sh
npm run check
BASE_PATH=/sakushi-planning-studio/ npm run build
BASE_PATH=/sakushi-planning-studio/ npm start
```

Pour mettre à jour le catalogue : `npm run refresh:games`.

## Mise en page et pixels

Le fond et les images initiales sont extraits du PSD fourni, qui n’est pas publié. La police Determination Mono provient du Mac de l’utilisateur. Les horaires utilisent la grille native de 75 unités du TTF, agrandie exactement 2×, sans interpolation. La réponse conserve des glyphes monochromes Regular et accepte jusqu’à trois lignes.

Dialogue : (351,45), 578 × 152. Cadres des jaquettes : (321,357) et (721,357), 260 × 344, bord blanc de 5 pixels. La boîte locale reproduit les pixels du dialogue initial du PSD à partir des sprites originaux et de la police native.

Les atlas peuvent être régénérés avec `python scripts/generate-bitmap-font.py` (Pillow et fonttools requis).

## Reprendre un ancien brouillon

Le stockage du navigateur est propre à chaque adresse. Depuis l’ancien site, utiliser **Sauver le projet**, puis **Ouvrir** sur GitHub Pages. Les anciens fichiers JSON, y compris les références de jaquettes Steam, restent compatibles.

## Sources et crédits

- Intégration et paramètres issus de [undertale-text-box-generator d’ImSakushi](https://github.com/ImSakushi/undertale-text-box-generator).
- Sprites et rendu de référence : [générateur de Demirramon](https://www.demirramon.com/generators/undertale_text_box_generator).
- Catalogue de noms et identifiants Steam : [jsnli/steamappidlist](https://github.com/jsnli/steamappidlist), données Steam.
- Undertale/Deltarune, personnages, polices et jaquettes appartiennent à leurs auteurs respectifs.
