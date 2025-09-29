Replay et Migrations :
- Stocker les actions dans le systeme de migrations quand l'utilisateur fait une action.
Stocker par Element Id "foo:bar$enchantment", une liste d'actions dans le bonne bonne ordre. Sans les dupliquer si c'est le même id et même params ont restock pas.

Action Core :
- [ ] core.mode (Permet de changer le mode entre deleted, disable, enable, only_creative)
- [ ] core.add_tag (Permet d'ajouter un tag à l'élément)
- [ ] core.remove_tag (Permet de retirer un tag à l'élément)
- [ ] core.toggle_tag (Permet de basculer un tag à l'élément)
 
Actions Enchantment :
- [ ] enchantment.value (min_cost_base, min_cost_per_level_above_first, max_cost_base, max_cost_per_level_above_first, weight, anvil_cost, max_level) (number)
- [ ] enchantment.items (primaryItems, supportedItems) (String array item of string item id or tag or null) - Null fonctionne que sur primaryItems sa retire le champ
- [ ] enchantment.slot (Permet de changer le slot de l'enchantement)
- [ ] enchantment.add_effects (Permet d'ajouter un effet à l'enchantement) (unknow)
- [ ] enchantment.remove_effects (Permet de retirer un effet à l'enchantement) (string par key_id)

A réecrire :
- Refaire LootTableAppearanceProbability et LootTableFlattener pour le format Data Driven.
- Refaire schema/enchantment/sorter au format Data Driven.
- Analyser, Parser, Compiler.
- Les actions pour que ça prenne le format Data Driven au lieu de Voxel.

A retirer
- Dossier Schema les 5 dossiers (loot, enchant, structure, structure_set, recipe)
- Attention a garder schema/enchantment/sorter et peut êtes les types Enchantment, LootTable, StructureSet, Recipe (Data Driven)
- Il faut aussi repasser sur de nombreux test pour retirer les parties Data Driven -> Voxel est inverssement
- Les actions core actuelle qui était versatille et les path.

Ont stockerais dans le store de la webapp studio.voxel\src\components\tools\Store.ts les elements dans le format suivants:
- Map<string, ElementDataDriven>
- ElementDataDriven contenants : <- Zustand utilisera ceci pour les re-render
    - element: DataDrivenElement
    - extra: comme tags, mode, disabled_effects, etc... (Spécifique a chaque concept)

Pour le Parser donc il auras un bute différent :
- Parcours les tags et dés qu'il trouve une référence l'inclure dans le champ extra.tags.
- Extraire les infromations global du datapack, nom, version, description, namespaces, isModded.
- A constituer la Map<string, ElementDataDriven> avec les elements parsés.

Pour le Compiler donc il auras un bute différent :
- Recréer les tags a partir du champs extra ont suivant la même logique qu'actuellement.
    1. Ont parcours les tags pour retirer tout les identifiants connu a partir des clefs de la map, ce qui laisse seulement les clefs inconnu.
    2. Remette les identifiants dans chaque tags a partir du champ extra.tags
- A gérer la propriéétes "mode" donc sois supprimer, désactivés ou autres...
- Cela outpit le datapack au format Record<string, Uint8Array<ArrayBufferLike>>

# Différence :
- Avant ont transformer les Elements de Data Driven fluctuant A Voxel format stable en prennant le numéro de datapack ce qui permettait de gérer les migrations, et le logger stocker les changement sur le format stable. ça permettait des actions plus libres.
- Maintenant ont utilise directement le format Data Driven, et les actions utilise le versionning. Ont stockes dans les logs les actions et params, pour les reproduires, les actions sont du coup stricte et moins libre. Mais moins de code et meilleurs DX.

L'état final est de plus avoir a gérer les schemas. Et de réduire considérablement le nombre de ligne de code dans le projet.

Prompts :
c:\Users\Hardel\Desktop\repository\voxelio\packages\breeze\TODO.md 

J'ai besoin de voir la faisabilités. Je te donne d'avantage de contexte voici la webapp: 
- C:\Users\Hardel\Desktop\repository\studio.voxel\src\components\tools\Store.ts
- C:\Users\Hardel\Desktop\repository\studio.voxel\src\lib\hook\useBreezeElement.ts
- C:\Users\Hardel\Desktop\repository\studio.voxel\src\lib\hook\useInteractiveLogic.ts
- C:\Users\Hardel\Desktop\repository\studio.voxel\src\components\tools\elements\ToolCounter.tsx
- C:\Users\Hardel\Desktop\repository\studio.voxel\src\components\tools\elements\RenderGuard.tsx
- C:\Users\Hardel\Desktop\repository\studio.voxel\src\routes\$lang\studio\editor\enchantment\main.tsx

Ont veut aussi s'assurer que le code qu'ont supprime des schema rendera pas les actions complexes. Donc éviter que le nombre de ligne de code augmente par rapport a la suppression.
Pas de Legacy Support, ou de deprecated code. Aucune gestion de l'ancien code. Donc ont peut modifier/supprimer sans crainte.
Ont ne touche pas a voxel.studio pour l'instant.

Je veux que tu regarde combien de code cela supprimer et simplifrais.