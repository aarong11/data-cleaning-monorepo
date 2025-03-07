# Shared Package

This package contains shared TypeScript types, interfaces, and utilities used across both the server and worker services.

## Features

- Shared TypeScript interfaces for datasets and records
- Common queue types for RabbitMQ messages
- Reusable utility functions
- Type definitions for configuration

## Project Structure

```
shared/
├── types/
│   ├── dataset.types.ts   # Dataset-related interfaces
│   ├── queue.types.ts     # Message queue types
│   ├── record.types.ts    # Record-related interfaces
│   ├── review.types.ts    # Review process types
│   └── index.ts          # Type exports
```

## Usage

The shared package is referenced as a local dependency in both server and worker services. To use it in either service:

```typescript
import { Dataset, Record, QueueMessage } from 'shared/types';
```

## Development

When making changes to shared types:

1. Update the types in the shared package
2. Rebuild the packages that depend on it:
```bash
# In shared package
npm run build

# In dependent packages (server/worker)
npm install
```

Note: The shared package is symlinked in the monorepo structure, so changes are immediately available to dependent packages after rebuilding.