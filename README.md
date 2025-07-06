# Voxelio

Voxelio is a monorepo that contains all packages from the Voxel organization,
focused on Minecraft development tools and related utilities. These packages
provide comprehensive solutions for working with Minecraft datapacks, resource
packs, mods, and various Minecraft-specific file formats.

## Packages

### [@voxelio/breeze](./packages/breeze)

Handles transformation of Data Driven elements into proprietary formats for
Voxel's internal projects. Contains generic utilities for datapack management
and processing.

### [@voxelio/zip](./packages/zip)

A lightweight ZIP library fork designed for creating and reading ZIP files. Not
specifically optimized for Minecraft, you can use it for any other purposes. It
is used for reading Minecraft mod `.jar` files and `.zip` archives.

### [@voxelio/converter](./packages/converter)

Converts Minecraft datapacks into mods, bridging the gap between different
Minecraft content formats. The datapacks and resource packs are just bundled in
.jar, with fabric/forge/quilt file loader, so zero java code is generated.

### [@voxelio/nbt](./packages/nbt) (WIP)

Reads and modifies Minecraft `.nbt` (Named Binary Tag) files, providing
comprehensive NBT data manipulation capabilities.

### [@voxelio/rendering](./packages/rendering) (Planned)

Renders Minecraft blocks in a canvas environment, enabling visual representation
of Minecraft content in web applications.

### [@voxelio/structure](./packages/structure) (Planned)

Reads datapacks to locate structures and generates 3D renders of these
structures for visualization purposes. With possibility to interact with each
part of the structure, and it's also possible to get some general information
about the structure.

### [@voxelio/validation](./packages/validation) (Planned)

Validates datapacks and resource packs to identify errors and inconsistencies,
ensuring content quality and compatibility. It's a one-time validation, not a
continuous validation (Not adapted for integration with IDEs).

### [@voxelio/updater](./packages/updater) (Planned)

Updates datapacks and resource packs between different Minecraft versions, both
forward and backward compatibility.

## Development

### Prerequisites

- Node.js 22 or higher
- pnpm 10 or higher

### Installation

This command will install all dependencies for all packages.

```bash
pnpm install
```

### Building

### Testing

The project uses Vitest for testing, you can run test for a specific package
with `pnpm run test --filter <package-name>` or just `pnpm test` in the package
directory.

```bash
pnpm run test
```

### Linting

The project uses Biome for linting, you can run linting for a specific package
with `pnpm run biome:check` and use `pnpm run biome:fix` to fix issues.

```bash
pnpm run biome:check
```

### Type checking

The project uses tsc for type checking, you can run type checking for a specific
package with `pnpm run check` in the package directory.

```bash
pnpm run check
```

## Deployment

This monorepo uses Changesets for version management and publishing. To release
packages:

1. Make your changes to the relevant packages
2. Create a changeset: `pnpm changeset`
3. Commit and push your changes
4. Merge the generated release PR to publish to NPM

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpm run test`
5. Run linting: `pnpm run biome:check` and use `pnpm run biome:fix` to fix
   issues
6. Run tsc: `pnpm run check`
7. Commit your changes: `git commit -m 'Add your feature'`
8. Push to the branch: `git push origin feature/your-feature`
9. Create a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add tests for new functionality
- Ensure all packages build successfully
- Run type checking with `pnpm run check`

## License

MIT License - see individual package licenses for specific terms.
