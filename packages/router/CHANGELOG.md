# @voxelio/router

## 0.2.0

### Minor Changes

- 272e119: The route is now the default export of a page: `export default defineRoute(id, { component, ... })`. The component is a field of the route, so it can live in the file or be imported. `export default` for the component and `export const route` are gone. A page whose component changes is still refreshed in place.

## 0.1.1

### Patch Changes

- 2b133e5: First version published by the release workflow. No change in the code.
