---
"@voxelio/deploy": minor
---

Add Minecraft 26.1, 26.1.1, 26.1.2 and 26.2 (Java 25), fix Java 21 requirement for 1.20.5+. Restore the missing examples folder (workflow template, example config and changeset) lost during the monorepo migration, which made `voxset` setup crash. Switch config back to deploy.json to match existing repositories and the deployed workflows. Fix package exports pointing to non-existent dist files, fix arktype validation never reporting invalid configs, and validate mod IDs against the Fabric identifier format.
