# Context GAP — Éditeur social + Design system handoff

## Règle permanente
**N'écris jamais de code sans mon autorisation explicite ("go"). On discute l'approche d'abord.**

---

## Identité & projet
Hugo Brunner, artiste digital, collectif **The Gap Group BXL** (Bruxelles).  
Programme de mentorat pour artistes émergent·e·s.  
Site : thegapgroupbxl.com | Repo : `/Users/bunnerfixe/Documents/GitHub/GAP`

---

## Design system

### Typographie
**Obviously Variable** (OhnoType) via Typekit : `https://use.typekit.net/scu0dna.css`  
Axes : `ital`, `wght`, `wdth`

Réglages en vigueur :
- `.h1 .inner` (GAP, GROUP) → `"wght" 803, "wdth" 121`
- `.h1 .outer` (THE, BXL) → `"wght" 500, "wdth" 100`
- `.h2 .line` (PAIRING IS CARING) → `"wght" 699, "wdth" 121`
- `.call` → `"wght" 480, "wdth" 100`
- `.btn` → `"wght" 650, "wdth" 100`
- `footer` → `"wght" 320, "wdth" 100`

### A-ponts
Letterforms en pont sur les A. Attribut HTML `data-a-anim` + GSAP.  
Ex : `G<span data-a-anim data-a-id="gap">A</span>P`  
Question ouverte : statique vs animé dans les zones éditables.

### Animation canvas (architecture 3 couches)
- `bg-canvas` z-index:-1 → dégradé fond (5 blobs BG : b1–b5, couleurs/positions/tailles + warpAmt)
- CSS blobs z-index:0 → suivent les particules via JS transform
- `main-canvas` z-index:1 → moteur physique Cellules (membrane + aura layers)

Changements **prévus mais pas codés** (pas de "go" donné) :
- `GLOBAL_SCALE ×3` — single constant, canvas transform centré
- Asymétrie dorée 1.618 entre les deux auras
- Pulse plus lent

---

## Contexte handoff — éditeur social

Hugo a produit seul tous les assets visuels (posts Instagram, stories, carousel, cartes postales).  
Doit passer la main à des collaborateurs — background design incertain.

**Pourquoi pas Canva/Adobe Express :** pas de support variable font. Les axes Obviously Variable sont perdus dans les zones éditables. Dealbreaker.

**Architecture outil retenue (émergente) :**
- **Niveau 1 — Web Native + Claude Design** avec passerelles
  - 3 sous-niveaux imbriqués : design system ↔ templates ↔ éditeur
- **Extension : Canva** pour templates simples non-typographiques

---

## Sujet en cours : éditeur de texte social

Exploration des libertés, limites et questions architecturales pour construire un éditeur HTML/JS/CSS via Claude Design + Claude Code.

### Export prévu
- **PNG** → `html2canvas` (attendre `document.fonts.ready` avant capture pour Typekit)
- **MP4/WebM** → `MediaRecorder` + `canvas.captureStream()` sur le canvas animation existant
- Conversion WebM→MP4 possible via `ffmpeg.wasm` client-side (~31MB, version single-thread sans headers spéciaux)

### Formats cibles
- Instagram post 1:1 — 1080×1080
- Story 9:16 — 1080×1920
- Carousel slide

### Questions architecturales ouvertes

**1. WYSIWYG vs Form+Preview ?**  
- WYSIWYG : on tape directement dans le template rendu (contenteditable dans divs stylisées)  
- Form+Preview : champs à gauche, canvas mis à jour en temps réel à droite  
- WYSIWYG plus naturel mais techniquement délicat (contenteditable + variable font + overflow)  
- Form+Preview plus contrôlé et prévisible  
→ C'est le choix architectural premier, avant tout le reste.

**2. Périmètre d'édition exact du collaborateur ?**  
- Texte seulement ?
- Texte + choix de fond (parmi un set préparé par Hugo) ?
- Texte + taille de font ?  
→ Plus on ouvre, plus de dérive possible + UI plus complexe.

**3. Overflow — texte trop long ?**  
Canvas fixe 1080×1080. Options :
- Limite de caractères (le plus simple)
- Auto-scale de la font
- Blocage de saisie au-delà d'un seuil  
→ À décider avant de coder.

**4. A-ponts dans les zones éditables ?**  
Si le collaborateur tape "PAIRING", le A devient-il automatiquement un pont ?  
→ Parsing + injection GSAP complexe. Alternative : A-ponts uniquement dans les éléments lockés produits par Hugo.

**5. Typekit + html2canvas**  
Typekit chargé via CDN externe. Risque : capture sans font si pas encore chargée, CORS potentiel.  
→ Solution : `document.fonts.ready` avant de déclencher la capture.

---

On est en phase de bilan/cadrage. Rien n'a été codé.
