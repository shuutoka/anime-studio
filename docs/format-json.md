# Format JSON des animations — version 1

Le moteur prend un JSON local contenant une scène dans un repère logique. Les animations sont évaluées à partir du temps absolu de la scène, en secondes. L’aperçu et le rendu MP4 utilisent le même calcul.

## Champs racine

| Champ | Type | Règle |
|---|---|---|
| `formatVersion` | nombre | Doit valoir `1`. |
| `name` | texte | Nom affiché dans l’application. |
| `duration` | nombre | Durée en secondes, strictement positive, maximum 3600. |
| `width`, `height` | nombres | Dimensions logiques de la scène. |
| `fps` | nombre | Doit valoir `30` dans la V0.1.0. |
| `background` | couleur | Couleur unie, par exemple `#FFFFFF`. |
| `objects` | tableau | Ordre d’affichage du fond vers le premier plan. |

Les coordonnées (0,0) commencent en haut à gauche. Pour les formes, `x` et `y` désignent le coin supérieur gauche ; pour les lignes et flèches, ils désignent le départ et `width`,`height` les écarts horizontal et vertical. Les dimensions de sortie sont adaptées à l’image logique sans étirement.

## Objets pris en charge

`text`, `rectangle`, `circle`, `ellipse`, `line`, `arrow`, `group`, `image`, `svg`.

Champs communs : `id` unique, `x`, `y`, `width`, `height`, `rotation` en degrés, `scale`, `opacity` entre 0 et 1, `fill`, `stroke`, `strokeWidth`, `start`, `end`, `animations`.

Un objet est absent avant `start` et à partir de `end` (secondes de la scène). Un groupe contient `children`, placés dans son repère local.

Pour du texte : `text`, `fontSize`, `fontFamily`, `fontWeight`, `textAlign` (`left`, `center`, `right`), `lineHeight`. Les sauts de ligne sont écrits `\n`.

Pour une image : `asset` est le nom exact d’un fichier raster que l’utilisateur a ajouté dans « Ressources locales » (PNG, JPEG, WebP, GIF ou AVIF). Aucun fichier n’est téléversé. Le nom peut inclure son extension.

Pour un SVG simple : fournir le texte dans `svg`. Seuls des éléments géométriques et textes SVG en liste blanche sont admis. Scripts, gestionnaires d’événements, liens externes, références `url()` et ressources distantes sont refusés.

## Animations

Chaque entrée de `animations` comporte :

```json
{ "property": "x", "from": 100, "to": 500, "start": 1, "duration": 3, "easing": "easeInOut" }
```

Propriétés : `x`, `y`, `width`, `height`, `rotation`, `scale`, `opacity`, `fill`, `stroke`. Les valeurs numériques sont interpolées. Les couleurs sont interpolées si elles sont écrites au format hexadécimal (`#RGB` ou `#RRGGBB`). `easing` accepte `linear`, `easeIn`, `easeOut`, `easeInOut`. Les intervalles de plusieurs propriétés ou objets peuvent se chevaucher.

Les pauses sont simplement des périodes sans changement entre deux animations. À une vitesse `v`, la durée exportée est la durée de scène divisée par `v`, à l’arrondi supérieur de l’image la plus proche. La sortie reste à 30 FPS.

## Exemple minimal

```json
{
  "formatVersion": 1,
  "name": "Une orbite",
  "duration": 5,
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "background": "#FFFFFF",
  "objects": [
    {
      "id": "lune",
      "type": "circle",
      "x": 300,
      "y": 440,
      "width": 180,
      "height": 180,
      "fill": "#D7DCE0",
      "animations": [
        { "property": "x", "from": 300, "to": 1400, "start": 0, "duration": 5, "easing": "easeInOut" }
      ]
    },
    {
      "id": "legende",
      "type": "text",
      "x": 100,
      "y": 130,
      "width": 1400,
      "text": "Déplacement schématique",
      "fontSize": 52,
      "fontWeight": "bold",
      "fill": "#173B36"
    }
  ]
}
```

Les erreurs d’import indiquent le chemin du champ concerné. Les limites de la V0.1.0 sont décrites dans le README.
