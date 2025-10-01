Workflow des elements :

---

# Step 1 - User Upload and Parse
L’utilisateur met son datapack en zip ou jar.  
1. Parser pour extraire ces metadata :  
   - **namespaces** : `string[]`  
   - **version** : `number`  
   - **description** : `string`  
   - **isModded** : `boolean`  
   - **name** : `string`  
   - **files** : `Record<string, Uint8Array<ArrayBufferLike>>`  

2. Ont utilise File pour parcourir le datapack pour extraire les registries des elements a partir de analyser.  
3. Parcourir les éléments pour savoir dans quels tags ils sont et les ajouter dans le champ **tags**.  
4. Chaque élément passe par le parser pour être transformé du format **DataDriven (Mojang)** vers le format **Voxel (Stable)**, ce qui permet de gérer correctement le multi-version et de faciliter la webapp ou les actions.  

---

# Step 2 - User Interactions

1. L’utilisateur clique sur un composant de l’interface, ce qui appelle une action et la trace (**trackChanges** et **updateData**).  
2. Stocker les changements dans les logs.  
3. Modifier l’élément et actualiser le store.  
4. Gérer correctement le re-render avec **zustand** et des sélecteurs précis pour éviter le re-render des mauvais composants.  

---

# Step 3 - User Download & Compile

1. Utiliser les **files** d’origine immuables, les **elements** qui ont été modifiés, ainsi que les **logs** (les logs indiquent quels éléments ont été modifiés : `"updated"`, `"added"`, `"deleted"`) grâce aux actions.  
2. Chaque élément passe par le **compiler** pour être transformé du format **Voxel (Stable)** vers le format **DataDriven (Mojang)** afin de gérer correctement le multi-version.  
  2.5. Attention il existe un champ "mode" qui vaut, "Deleted", "Disabled", "Enabled", "Only Creative". Qui peut impacter les tags ou l'élement.

3. Parcourir les éléments du concept pour créer une **map d’id**.  
4. Ouvrir chaque tag et retirer les id par rapport à la map, afin de ne laisser que les id non connus.  
5. Parcourir chaque enchantment, parcourir son champ **tags**, puis ouvrir chaque tag pour y insérer l’id de l’enchantment.  
6. Transformer en instance de **Datapack**.  
7. Transformer en **zip**.  