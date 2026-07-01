# RWA Simulator — Angular 12 Side App

This folder is a separate Angular 12 application scaffold that can be developed next to the existing React/Vite app without changing the current production simulator.

## Local setup

```bash
cd angular12
npm install
npm start
```

The existing React app remains in the repository root and keeps its own `package.json` and Vite configuration.

## Migration approach

1. Keep the React app unchanged while building Angular screens here.
2. Move/copy pure calculation code from `../src/domain` into Angular services or a future shared package.
3. Start with one feature module, preferably the construction project flow.
4. Compare Angular outputs against the existing domain tests before replacing any production UI.
