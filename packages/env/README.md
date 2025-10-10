# @voxelio/env
Lightweight environment variable loader. Zero dependencies. 

## Installation
```bash
npm install @voxelio/env
```

## Usage
```typescript
import "@voxelio/env/config";
```

Or programmatically:
```typescript
import { config } from "@voxelio/env";

config();
config({ path: ".env.production" });
config({ override: true });
```

## API
**config(options?)**
- `path?: string` - Path to .env file (default: `.env`)
- `override?: boolean` - Override existing env vars (default: `false`)

## License
MIT - Hardel