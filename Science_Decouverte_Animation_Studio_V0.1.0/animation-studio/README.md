# Science & Découverte — Animation Studio V0.1.0

Application React/TypeScript statique qui lit des instructions JSON, prévisualise une animation de façon déterministe et encode un MP4/H.264 localement dans le navigateur. Les fichiers JSON et images restent sur l’appareil. Aucun compte, serveur applicatif ou API payante n’est utilisé.

## Fonctionnalités

- Import de JSON version 1, avec erreurs de validation détaillées.
- Deux exemples modifiables : éclipse solaire (20 s) et cycle de *Dipylidium caninum* (30 s).
- Scène Canvas 2D avec texte, rectangle, cercle, ellipse, ligne, flèche, groupes, images locales et SVG simples assainis.
- Chronologie déterministe évaluée par temps absolu, 30 FPS.
- Lecture, pause, retour au début, navigation par curseur et vitesses 0,25× à 3×.
- Export MP4 avec codec AVC/H.264, en 1920×1080 ou 1280×720, et choix du nom.
- Écriture directe via File System Access API quand elle existe ; téléchargement mémoire comme solution de repli.
- Rendu entièrement côté navigateur. Aucune vidéo, animation ou image n’est envoyée à un service distant.
- Préparation d’un déploiement GitHub Pages dans un sous-dossier avec `base: './'`.

## Compatibilité et limites

La cible est Chrome ou Edge récents sur ordinateur, sur HTTPS ou `localhost`. L’export vérifie la prise en charge du codec H.264 aux dimensions choisies avant de démarrer. `VideoEncoder`/WebCodecs dépend du navigateur, du système et du matériel ; l’application refuse l’export si la configuration n’est pas prise en charge.

Le rendu utilise Canvas 2D et ne prend donc pas en charge l’ensemble du HTML/CSS. Les objets, transformations et propriétés V1 documentés dans [`docs/format-json.md`](docs/format-json.md) sont ceux du moteur. La sortie est sans audio et opaque. Seuls les SVG géométriques/textes simples passent la liste blanche. Les images importées sont des fichiers raster et doivent être sélectionnées séparément de leur JSON. Les couleurs animées interpolées sont à écrire en hexadécimal.

Les navigateurs sans File System Access API utilisent un tampon mémoire. Pour les vidéos longues ou volumineuses, utilisez un navigateur Chromium récent qui propose l’enregistrement direct sur disque. L’export est séquentiel et peut prendre du temps en Full HD ; garder l’onglet ouvert et au premier plan améliore la fiabilité.

## Prérequis

- Node.js 20.19+ ou 22.12+ recommandé.
- npm.
- Chrome / Edge récent pour tester le vrai rendu MP4.

## Installation et lancement

```bash
npm ci
npm run dev
```

Vite affiche l’adresse locale (habituellement `http://localhost:5173`). Ouvrez-la dans Chrome ou Edge. Choisissez une démo, déplacez le curseur, changez la vitesse, puis exportez en MP4.

## Commandes

```bash
npm test       # tests unitaires du format, du minutage et des vitesses
npm run build  # vérification TypeScript et compilation de production
npm run preview
```

## Export vidéo

1. Importer un fichier JSON ou charger l’une des démos.
2. Ajouter séparément les images raster référencées par `asset` si nécessaire.
3. Vérifier l’aperçu et choisir 1080p ou 720p.
4. Choisir une vitesse : la durée est calculée et le nombre d’images exportées change, mais la fréquence reste de 30 FPS.
5. Entrer un nom de fichier puis lancer l’export. Sur Chrome/Edge, choisir un emplacement dans la boîte de dialogue. Le fichier ne quitte pas l’appareil.

La V0.1.0 encode avec Mediabunny et les encodeurs WebCodecs fournis par le navigateur. MP4 est le conteneur, AVC/H.264 le codec. Le logiciel ne renomme pas de WebM en MP4. Si H.264 n’est pas encodable, le bouton reste désactivé ou l’export affiche la raison disponible.

## Format JSON

Le schéma complet est décrit dans [`docs/format-json.md`](docs/format-json.md). Exemples livrés :

- [`public/demos/eclipse_solaire.json`](public/demos/eclipse_solaire.json)
- [`public/demos/cycle_tenia_chat.json`](public/demos/cycle_tenia_chat.json)

Pour une image, utiliser le champ `asset` avec le nom de fichier exact, puis ajouter ce fichier raster depuis « Ressources locales ». Aucun HTML ou JavaScript arbitraire n’est exécuté depuis les documents importés.

## GitHub Pages

Le workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) compile et publie `dist` à chaque push sur `main` ou à la demande. Pour un dépôt existant, ajoutez ces fichiers uniquement au dépôt destiné à Animation Studio, activez **Settings → Pages → Build and deployment → GitHub Actions**, puis poussez la branche `main`. Aucun dépôt n’a été modifié dans la préparation de ce ZIP.

`base: './'` rend les ressources compilées relatives à la page et permet un hébergement à la racine ou sous `https://utilisateur.github.io/nom-du-depot/`.

## Dépendances et licences

- React et React DOM — MIT.
- Vite et plugin React — MIT.
- TypeScript — Apache-2.0.
- Vitest — MIT.
- Mediabunny — MPL-2.0 : usage dans l’application sans redevance ; si le code source de Mediabunny est modifié puis distribué, les changements de ce code doivent être publiés sous MPL-2.0. Le projet ne modifie pas Mediabunny.
- H.264/AVC est un format breveté dans certaines juridictions. WebCodecs utilise l’implémentation native du navigateur/système ; les obligations de licence d’un usage ou d’une distribution commerciale peuvent dépendre du contexte.

Un audit de licence complet des dépendances transitives reste à effectuer avant une distribution commerciale élargie.

## Tests et statut de validation

Validation réalisée pour cette livraison : `npm test` (6 tests réussis), dont le calcul des durées/vitesses, l’évaluation déterministe à un temps absolu, les erreurs JSON, les noms de fichier et la validation des deux démos JSON ; `npm run build` (TypeScript et bundle Vite réussis).

Limite de validation : aucun binaire Chromium local n’était disponible et le navigateur distant ne pouvait pas joindre le serveur local. Aucun vrai export MP4 n’a donc été produit dans cet environnement. Avant usage de production, lancer un export 720p et 1080p dans Chrome/Edge, vérifier la lecture H.264 dans un lecteur externe, et comparer quelques images de l’aperçu et du fichier final. L’application détecte H.264 à l’ouverture et refuse une configuration non prise en charge ; cela ne remplace pas ce test d’intégration sur l’ordinateur cible.
