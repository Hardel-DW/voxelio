---
"@voxelio/router": minor
---

The route is now the default export of a page: `export default defineRoute(id, { component, ... })`. The component is a field of the route, so it can live in the file or be imported. `export default` for the component and `export const route` are gone. A page whose component changes is still refreshed in place.
