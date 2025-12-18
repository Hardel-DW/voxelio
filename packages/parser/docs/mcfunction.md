# Mcfunction parser
mcfunction line
    │
    ├─► [1] Binary Brigadier (~1kb)
    │       → direct refs
    │
    ├─► [2] Extract components [...] from item arguments
    │       → traverse.ts + mcdoc schema "item component"
    │
    ├─► [3] Extract JSON text components
    │       → traverse.ts + mcdoc schema "text component"
    │
    └─► [4] Extract selectors @x[...]
            → mini-parser: predicate=X, advancements={X=...}

Macros and NBT are not supported. Assuming NBT will be removed in future versions. Skip line with macros starting with $

-----

1. Commandes directes (Brigadier)
/function foo:bar
/advancement grant @s only foo:bar
/loot give @s loot foo:bar

2. Item Components [...]
Sur tous les parsers item_stack, item_predicate
/give @s diamond_sword[enchantments={levels:{"foo:bar":1}}]
/clear @s stick[!custom_data]
/clear @s stick[damage~10]        # match approximatif ?
/clear @s stick[damage|other]     # union ?
Refs possibles: enchantment, item, loot_table (dans food component), etc.
Solution: Parser mcdoc existant sur le contenu des [...]

3. Text Components (JSON)

Parsers: minecraft:component (tellraw, title, bossbar, etc.)
/tellraw @a {"clickEvent":{"action":"run_command","value":"/function foo:bar"}}
/tellraw @a {"hoverEvent":{"action":"show_item","contents":{"id":"foo:bar"}}}
Refs possibles: Dans clickEvent (commands imbriquées!), hoverEvent (items)
Solution: Parser mcdoc avec schema text component

4. Filtres de sélecteur @a[...]
@a[predicate=foo:bar]           # ref predicate
@a[advancements={foo:bar=true}] # ref advancement
Seulement 2 filtres data-driven: predicate et advancements

---

# Component Predicates Syntax
General format: <item_type>[<list of tests>]
Clear use this predicate syntax. Not give for example.

The 3 types of tests:
component_id=value - Exact match of a component
Example: minecraft:stick[damage=10]

component_id - Check if a component exists
Example: minecraft:stick[damage] (checks if the item has a damage component)

predicate_id~value - Use a sub-predicate (flexible test)
Example: *[damage~{durability:{min:3}}]

## Special operators:
! (exclamation mark) - Negation: inverts the test
Example: *[!damage] (items WITHOUT damage component)
Example: *[!count=1] (items whose count is NOT 1)
Example: *[!minecraft:enchantments] (items without enchantments)

| (vertical bar) - Logical OR
Example: *[damage|damage=0] (items with damage component OR damage=0)
Important note: The priority of | is HIGHER than , (unlike classic programming languages)

, (comma) - Logical AND
Example: *[damage,count=1] (items with damage AND count=1)

~ (tilde) - Sub-predicate: advanced/flexible test
Example: *[custom_data~{awesome:true}]
Example: *[enchantments~[{enchantment:"minecraft:unbreaking"}]]

# Brigadier parser
Problem                                                                                                                                              
- Official Brigadier JSON = 455kb (too heavy for bundle)                                                                                         
- Spyglass/mcdoc doesn't parse mcfunctions

Solution: Condensed binary format containing only patterns with data-driven refs.
No versioning. No superset. We're not trying to validate commands but to find refs whether the command is valid or not. In a pragmatic way.

Binary format (~1kb)

```bash
HEADER (4 bytes):
[magic: "MC"] [format: 1] [pattern_count: 1]

REGISTRIES (null-terminated):
"function\0advancement\0loot_table\0..."

LITERALS (null-terminated):
"function\0grant\0revoke\0loot\0give\0..."

PATTERNS:
[token_count] [tokens...] [capture_index] [registry_index]

Token types:
    0x00-0x3F = literal index
    0x80      = ANY (skip argument)
```

### Example of encoding
```text
"function <name>"
→ [01] [00] [80] [01] [00]
    │    │    │    │    └─ registry: function (index 0)
    │    │    │    └─ capture position: 1
    │    │    └─ ANY argument
    │    └─ literal "function" (index 0)
    └─ 1 token avant capture
```


Q&A:
Recursive text components - A clickEvent can contain /function which can contain... do we limit the depth? Answer: No just ignore the nested commands.
