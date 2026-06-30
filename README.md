# Ableton Session Mapper

Extension TypeScript pour Ableton Live Extensions SDK. Elle analyse le Set
courant et écrit une représentation JSON des pistes normales, groupes, retours,
master, devices, racks, chains, macros lisibles et sends disponibles.

## Prérequis

- Une version d'Ableton Live compatible avec Extensions API `1.0.0`
- Node.js 20 ou plus récent
- Le SDK bêta décompressé dans
  `/Users/jeanclaude/Downloads/extensions-sdk-1.0.0-beta.0`

## Installation

```bash
cd extension
npm install
npm run build
```

Le `package.json` référence les archives SDK et CLI locales fournies. Si le SDK
est déplacé, adaptez les deux dépendances `file:` avant `npm install`.

## Usage

1. Lancez `npm start` depuis `extension/` pour construire et charger l'extension.
2. Dans Live, faites un clic droit sur un contexte supporté : piste audio,
   piste MIDI, clip audio, clip MIDI, clip slot, scène, ou sélection
   d'arrangement sur piste audio/MIDI.
3. Choisissez **Export Session Map**.
4. En développement avec `npm start`, le fichier est écrit dans
   `exports/session-map.json` à la racine de ce projet. Une extension installée
   utilise le répertoire de stockage persistant attribué par Live. Le chemin
   exact apparaît dans les logs de l'Extension Host.

Le clic droit sert uniquement de point d'entrée : l'export couvre toujours le
Set complet. Un exemple est fourni dans `exports/session-map.example.json`.

## État actuel des vues (v0.7.5)

Le projet fournit aujourd'hui six vues externes complémentaires :

- **Visual Launcher** : page d'accueil qui centralise toutes les sorties
  disponibles et indique quoi générer si un fichier manque.
- **HTML Report** : rapport détaillé piste par piste, avec devices, sends,
  racks et résumés de structure.
- **Session Grid** : vue externe plus proche d'une Session View Ableton,
  avec une colonne par piste dans l'ordre exact du Set.
- **Flow** : arborescence technique du Live Set, utile pour lire la structure.
- **Git / Metro** : visualisation stylisée façon métro, plus artistique,
  pensée pour la lisibilité rapide des pistes et devices principaux.
- **Kanban** : colonnes par piste avec les devices empilés dessous.

## Stable workflow

Depuis la racine du projet :

```bash
npm start
```

Puis dans Ableton Live :

1. clic droit sur un contexte supporté ;
2. choisir **Export Session Map** ;
3. le launcher s'ouvre dans le navigateur ;
4. choisir une visualisation :
   - Session Grid
   - HTML Report
   - Flow
   - Git / Metro
   - Kanban
   - Raw Data

### No WebView Stable Mode (v0.4.2)

La WebView intégrée est désactivée car même une WebView minimale peut faire
planter Ableton Live Beta. Utilisez la preview HTML externe à la place.

En usage normal, le menu **Extensions** n'affiche qu'une seule entrée :

- **Export Session Map** : scanne le Live Set complet en mode `ultra-safe`,
  écrit `exports/session-map.json`, génère le report HTML, le Session Grid,
  l'index visuel `exports/session-map-diagrams.html`, crée les fichiers latest +
  archivés, puis ouvre ce launcher dans le navigateur système.

L'interface reste volontairement externe : la WebView intégrée du SDK est
désactivée car elle s'est révélée instable dans Live Beta. Le viewer HTML
continue donc à s'ouvrir dans le navigateur, jamais dans une WebView Ableton.

Depuis la racine du projet :

```bash
npm run build
npm start
npm run preview
npm run generate:session-grid
npm run generate:diagrams-index
npm run generate:mermaid
npm run render:mermaid
npm run export:diagram
npm run generate:mermaid:flow
npm run generate:mermaid:git
npm run generate:mermaid:kanban
npm run render:mermaid:flow
npm run render:mermaid:git
npm run render:mermaid:kanban
npm run export:diagram:flow
npm run export:diagram:git
npm run export:diagram:kanban
npm run export:diagram:all
npm run open:diagrams
```

`npm run preview` régénère puis ouvre le rapport dans le navigateur par défaut.
`npm run open:diagrams` ouvre directement le launcher visuel latest.

## Available commands

Depuis la racine du projet :

```bash
npm run generate:session-grid
npm run generate:diagrams-index
npm run generate:mermaid:flow
npm run generate:mermaid:git
npm run generate:mermaid:kanban
npm run export:diagram:flow
npm run export:diagram:git
npm run export:diagram:kanban
npm run export:diagram:all
npm run open:diagrams
npm run open:diagram:flow
npm run open:diagram:git
npm run open:diagram:kanban
```

L'ouverture automatique externe est activée par défaut dans l'extension. Pour
la désactiver explicitement :

```bash
ENABLE_OPEN_HTML=false npm start
```

Quand l'ouverture automatique est active, l'action **Export Session Map** tente
d'ouvrir le launcher `exports/session-map-diagrams.html` dans le navigateur
système après la génération des fichiers HTML. Si l'ouverture échoue, l'export
reste considéré comme réussi et le chemin du launcher est laissé dans les logs.

Par défaut, l'action Live ne lance pas les rendus Mermaid lourds. Pour les
activer explicitement pendant l'export depuis Ableton :

```bash
GENERATE_DIAGRAMS_ON_EXPORT=true npm start
```

Si `GENERATE_DIAGRAMS_ON_EXPORT` reste absent ou différent de `true`, le
launcher affiche les derniers Flow / Git / Kanban déjà générés s'ils existent,
ou un état `Not generated yet` avec la commande npm correspondante.

### Fichiers générés

Chaque export produit désormais :

- des fichiers `latest`, toujours écrasés :
  - `exports/session-map.json`
  - `exports/session-map.html`
  - `exports/session-map-session-grid.html`
  - `exports/session-map-diagrams.html`
- des fichiers archivés datés :
  - `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm.json`
  - `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm.html`
  - `exports/Ableton-Session-Grid_YYYY-MM-DD_HH-mm.html`

Si un nom de Set est disponible via le SDK, il est utilisé comme préfixe
sanitisé du fichier archivé. En cas de collision à la même minute, l'export
ajoute les secondes, puis un suffixe numérique si nécessaire.

### Export Mermaid externe (v0.5)

Le projet peut maintenant générer un diagramme Mermaid à partir du JSON stable,
sans repasser par Ableton Live et sans utiliser de WebView.

Commande :

```bash
npm run generate:mermaid
```

Entrée :

- `exports/session-map.json`

Sorties :

- `exports/session-map.mmd`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm.mmd`

Le fichier `.mmd` représente :

- le Live Set ;
- les tracks normales dans l'ordre du Set ;
- les Return Tracks ;
- le Master Track ;
- les devices principaux ;
- les racks via `chainsSummary` et `padsSummary` quand ils sont présents.

Cette génération est entièrement externe au SDK Live : elle ne modifie pas le
scan Ableton, ne touche pas à l'action Live stable et ne réactive aucune
WebView. Elle prépare directement la phase v0.6 pour le rendu SVG/PNG.

### Export SVG / PNG externe (v0.6)

Le rendu graphique reste lui aussi entièrement externe à Ableton Live. Il
part du fichier Mermaid latest, sans toucher au scan SDK ni à l'action Live
stable.

Commandes :

```bash
npm run generate:mermaid
npm run render:mermaid
npm run export:diagram
npm run open:diagram
```

Différence entre les commandes :

- **Export Session Map** dans Live : produit le JSON stable, le HTML viewer et
  les archives latest + datées.
- **generate:mermaid** : lit `exports/session-map.json` et écrit le diagramme
  Mermaid `.mmd`.
- **render:mermaid** : lit `exports/session-map.mmd` et produit le rendu
  graphique externe.
- **export:diagram** : enchaîne `generate:mermaid` puis `render:mermaid`.
- **open:diagram** : ouvre le SVG latest généré sur macOS.

Sorties latest :

- `exports/session-map.mmd`
- `exports/session-map.svg`
- `exports/session-map.png`
- `exports/session-map-mermaid.html`

Sorties archivées :

- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm.mmd`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm.svg`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm.png`

Le HTML Mermaid local embarque le SVG rendu, pour fournir un aperçu directement
ouvrable au navigateur sans dépendre d'une WebView Ableton.

### Mermaid visualization profiles (v0.7)

Le même `exports/session-map.json` peut maintenant produire plusieurs profils
de visualisation Mermaid, toujours en dehors d'Ableton Live.

Profils disponibles :

- **flow** : la vue arborescente classique
- **git** : une vue `gitGraph` stylisée façon métro
- **kanban** : une vue colonnes Tracks / Return Tracks / Master

Commandes :

```bash
npm run generate:mermaid:flow
npm run generate:mermaid:git
npm run generate:mermaid:kanban
npm run render:mermaid:flow
npm run render:mermaid:git
npm run render:mermaid:kanban
npm run export:diagram:flow
npm run export:diagram:git
npm run export:diagram:kanban
npm run export:diagram:all
```

Fichiers latest :

- `exports/session-map-flow.mmd`
- `exports/session-map-flow.svg`
- `exports/session-map-flow.png`
- `exports/session-map-git.mmd`
- `exports/session-map-git.svg`
- `exports/session-map-git.png`
- `exports/session-map-kanban.mmd`
- `exports/session-map-kanban.svg`
- `exports/session-map-kanban.png`

Archives :

- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_flow.mmd`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_git.mmd`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_flow.svg`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_git.svg`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_flow.png`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_git.png`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_kanban.mmd`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_kanban.svg`
- `exports/Ableton-Session-Map_YYYY-MM-DD_HH-mm_kanban.png`

Le profil **git** ne cherche pas à représenter Git littéralement : il détourne
`gitGraph` pour créer une lecture type lignes de métro, avec une branche par
piste, une branche par return, un commit par piste et un commit par device
principal. Les racks y sont résumés via `chainsSummary` / `padsSummary` pour
garder un rendu lisible.

Le profil **kanban** représente le Set en colonnes :

- **Tracks**
- **Return Tracks**
- **Master**

Chaque carte résume la piste avec son type, le nombre de devices, le nombre de
sends et le nombre de racks détectés quand il y en a.

Pour améliorer la lisibilité des rendus SVG/PNG, le projet utilise maintenant
une configuration commune Mermaid dans
[mermaid/mermaid.config.json](</Users/jeanclaude/Documents/ableton scripte arborescence/mermaid/mermaid.config.json>),
avec thème sombre, couleurs plus contrastées et un rendu PNG/SVG plus grand.

Le projet génère aussi un petit index local :

- [exports/session-map-diagrams.html](</Users/jeanclaude/Documents/ableton scripte arborescence/exports/session-map-diagrams.html>)

Il sert maintenant de **Visual Launcher UI** :

- **Session Grid**
- **HTML Report**
- **Flow**
- **Git / Metro**
- **Kanban**
- **Raw Data**

Chaque carte gère l'absence éventuelle des rendus Mermaid lourds et affiche la
commande à lancer pour les produire.

### Visual Launcher UI (v0.7.4)

L'action Ableton **Export Session Map** n'ouvre plus directement
`session-map.html`. Elle ouvre maintenant :

- [exports/session-map-diagrams.html](</Users/jeanclaude/Documents/ableton scripte arborescence/exports/session-map-diagrams.html>)

Ce launcher visuel reste entièrement externe au navigateur :

- aucune WebView Ableton ;
- une seule action visible dans Live ;
- export JSON stable inchangé ;
- report HTML et Session Grid générés à chaque export ;
- Mermaid Flow / Git / Kanban générés seulement si demandé.

Commandes utiles :

```bash
npm run generate:session-grid
npm run generate:diagrams-index
npm run open:diagrams
npm run export:diagram:all
npm run export:all
```

Workflow recommandé :

1. Dans Ableton : **Export Session Map**
2. Pour générer tous les diagrammes : `npm run export:diagram:all`
3. Pour rouvrir le launcher : `npm run open:diagrams`

## Known limitations

- La **WebView** intégrée est désactivée car elle s'est montrée instable dans
  Live Beta.
- L'export principal fonctionne en mode **ultra-safe** pour garantir que
  l'action Live se termine toujours proprement.
- Les **devices internes des racks** ne sont pas encore scannés en profondeur
  dans l'export principal.
- Les **routings I/O** et les **sidechains** ne sont pas encore exposés de
  façon exploitable par cette version du SDK, ou pas encore mappés par le
  projet.
- **Mermaid Git / Metro** est une visualisation artistique et lisible du Set,
  pas une topologie audio exacte.

## Experimental Internal Viewer

Un viewer interne minimal est disponible uniquement en mode expérimental.

Par défaut :

- il est **désactivé** ;
- le mode recommandé reste le **launcher externe** ;
- l'action normale **Export Session Map** reste inchangée.

Activation :

```bash
ENABLE_INTERNAL_VIEWER=true npm start
```

Quand cette variable vaut `true`, une action dev supplémentaire apparaît dans
Live :

- **Open Internal Viewer Experimental**

Cette fenêtre interne reste volontairement ultra-safe :

- titre + date d'export ;
- métriques simples ;
- boutons pour ouvrir les vues externes déjà générées ;
- aucun Mermaid lourd rendu dans la fenêtre ;
- aucun gros SVG/PNG injecté ;
- aucun remplacement du launcher externe.

Important :

- ce mode peut rester **instable selon la Live Beta / le SDK** ;
- il n'est jamais appelé par l'action stable **Export Session Map** ;
- s'il pose problème, gardez-le désactivé et utilisez le launcher externe.

Troubleshooting :

- si Live devient instable ou plante, relancez simplement sans ce mode :

```bash
npm start
```

- le mode recommandé reste le **launcher externe** ;
- la modale interne ne doit servir qu'aux tests ciblés du SDK.

### Actions de diagnostic en mode développement

Le code diagnostic est conservé, mais il est caché par défaut. Pour réactiver
les actions de diagnostic dans Live, lancez l'extension avec :

```bash
ENABLE_DIAGNOSTIC_ACTIONS=true npm start
```

Cela réenregistre les entrées suivantes :

- **Export JSON**
- **Export SDK Diagnostic JSON**
- **Export Rack Diagnostic JSON**

En mode normal, ces actions ne sont pas enregistrées.

### SDK Data Diagnostic (v0.3)

Le diagnostic teste explicitement les propriétés candidates de routing, groupes,
mixers, racks, chains, sends et sidechains, puis inventorie aussi les propriétés
visibles sur les prototypes du SDK. Chaque lecture est marquée `available`,
`missing` ou `error`; une propriété absente ne bloque jamais le scan.

Deux points d'entrée sont disponibles :

- **Export SDK Diagnostic JSON** dans le menu Extensions écrit le diagnostic
  général ;
- **Export Rack Diagnostic JSON** écrit le diagnostic ciblé racks/chains/pads.

Le résultat est écrit dans `exports/sdk-diagnostic.json`. Un diagnostic ciblé
des racks est aussi écrit dans `exports/rack-diagnostic.json`. Son résumé
indique le nombre de racks, chains et pads détectés ainsi que les propriétés
testées explicitement sur les devices de type rack.

Le diagnostic principal indique le
nombre de tracks, routings, devices, racks, chains et erreurs rencontrés. Le
détail permet d'identifier les propriétés réellement exposées par la version de
Live/SDK utilisée avant d'ajouter leur lecture au modèle stable de
`session-map.json`. Les propriétés `missing` ne doivent pas être ajoutées à
l'extracteur principal ; les propriétés `available` peuvent servir de base à
une prochaine itération documentée et testée.

### Rack & Chain View (v0.4)

Le JSON principal exporte désormais les racks détectés avec :

- leurs chains internes ;
- leurs pads dérivés pour les Drum Racks quand le SDK expose des `DrumChain` ;
- les devices contenus dans chaque chain ;
- un sous-ensemble lisible de paramètres utiles, en priorité les macros ;
- les valeurs de volume/pan de chain quand le SDK les expose.

Le fichier `exports/routing-overrides.example.json` prépare une future surcouche
manuelle pour enrichir les routings quand le SDK ne les fournit pas encore.

## Robustesse

Toutes les lectures du modèle Ableton passent par `safeGet`. Une propriété
absente, un objet supprimé pendant le scan ou une lecture refusée produit une
valeur de repli (`null`, `[]` ou un libellé générique) au lieu d'interrompre
l'export. Seule l'absence du Set ou du dossier de stockage empêche l'écriture.

## Limites connues du SDK 1.0.0-beta.0

- Le nom/chemin du Set et la couleur des pistes ne sont pas exposés : `null`.
- La version actuelle du SDK ne semble pas exposer les routings I/O ni les
  sidechains. Le projet les laisse à `null` et pourra supporter un fichier
  `routing-overrides.json` plus tard.
- Le viewer affiche donc `Routing I/O non disponible dans cette version du SDK`.
- Les sidechains restent en TODO explicite dans le code jusqu'à exposition SDK.
- Les racks et chains sont exportés dans un format lisible, pas comme un dump
  complet du SDK ; certains états de chain restent `null` quand Live ne les
  expose pas.
- La classification `group` est déduite des relations `groupTrack` des pistes.
- Le SDK documente des scopes de menu contextuel pour `AudioTrack`,
  `MidiTrack`, `AudioClip`, `MidiClip`, `ClipSlot`, `Scene`,
  `AudioTrack.ArrangementSelection`, `MidiTrack.ArrangementSelection` et
  `ClipSlotSelection`.
- Le SDK ne documente pas, dans cette bêta, de scope dédié au clic droit sur un
  clip d'arrangement individuel. L'action reste néanmoins disponible sur les
  sélections d'arrangement de pistes audio/MIDI et exporte toujours le Live Set
  complet.
- Le viewer React/Vite est volontairement hors périmètre de ce MVP.
