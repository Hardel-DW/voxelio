# @voxelio/changeset

Minimal replacement for `@changesets/cli`, for pnpm and npm repositories (monorepo or single package). One dependency: `@clack/prompts`.

```sh
changeset          # interactive: packages, bump, summary → .changeset/<name>.md
changeset version  # bump versions, write CHANGELOG.md, delete the changesets
changeset publish  # publish versions missing from the registry, tag them name@version
```

A changeset is a markdown file, the same format as `@changesets/cli`:

```md
---
"@voxelio/zip": minor
"@voxelio/breeze": patch
---

What changed, written for the changelog.
```

- Each package gets the highest bump among its changesets.
- A public package depending on a released one (`dependencies`, `peerDependencies`, `optionalDependencies`) is released as a patch, since `workspace:*` is published as the exact version. Private packages are never released implicitly.
- `publish` uses `pnpm publish` when the repository uses pnpm, `npm publish` otherwise; `publishConfig` (access, tag, registry) is read by the package manager.
