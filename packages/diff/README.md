# @voxelio/diff

A library for generating and applying JSON patches RFC 6902 in TypeScript. Only 4KB and 1.9KB gzipped no dependencies.
- generate JSON RFC 6902 patches while preserving key order (`Differ.diff`),
- apply these patches safely (`Differ.apply`),
- align a modified JSON object to the key order of an original version (`Differ.reorder`).

## Usage rapide

```ts
import { Differ } from "@voxelio/diff";

const patch = new Differ(original, updated).diff();
const aligned = new Differ(original, updated).reorder();
const result = Differ.apply(original, patch);
```

- Tests with vitest : `pnpm run test` 
- Build with tsdown : `pnpm run build`
- Lint and format with biome : `pnpm run biome:format` and `pnpm run biome:check`

# Context :
In another project (Breeze) we transform Minecraft Data Driven to a proprietary format and make changes to it, and after re-transforming it to the original format, we need to align the keys to the original order.

`new Differ(original, updated).diff()` will generate a patch with RFC 6902 format, and with the **apply** method i can put them in the datapack, to get the original data. And that allow to make **Revert** and **Migration** functionnality in web editor.

And the `reorder` method is used to align the keys to the original object, without generating a patch, i need it to prepare a github commit, wihout change every keys orders.

---

Tu peux utiliser la dépendence diff qu'ont vient de développer pour remplacer l'ancine systéme de diff de breeze que j'ai supprimer. Pour repartir de zero ont et ont veut un truc trés minimal. 

Ont veut un moyen de connaitre les différences entre l'objets Voxel D'origine et l'objets Voxel après modification, il peut faire plusieurs modifications au cours de l'expérience, donc faut pas créer de doublon ou plusieurs patch pour le même identifiant.
Voila comment c'est dans le store de la webapp :
C:\Users\Hardel\Desktop\repository\studio.voxel\src\components\tools\Store.ts

- Ont stock les patch par identifiant comme /voxel/changeset/<namespace>/<registry>/<resource>.json
- Au parsing ont les récoltes pour former la classe Logger ou autre nom.
- Quand ont download ont prend la classe et rajouter les patch dans le datapack.
- Il nous faut une méthode ou ont donne un identifiant et nous dit si y'a un patch pour cet identifiant, verifie juste la présence du patch.

Ont veut aussi stocker quelque infos bonus dans les logs {namespaces, version, isModded}
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\src\core\engine\Parser.ts

Voici la listes des fichiers qui peuvent t'intéresser :
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\src\core\Datapack.ts
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\src\core\DatapackDownloader.ts
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\src\core\FileStatusComparator.ts
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\src\index.ts
C:\Users\Hardel\Desktop\repository\studio.voxel\src\components\tools\Store.ts
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\src\core\engine\Parser.ts
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\src\core\Identifier.ts
C:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\CLAUDE.md