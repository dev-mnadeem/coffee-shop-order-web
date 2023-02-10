// Runtime configuration, read by src/api/client.js before it falls back to the
// build-time REACT_APP_* variables.
//
// A create-react-app bundle bakes process.env.* in at build time, which would
// mean one image per environment. The Docker entrypoint rewrites this file
// when the container starts, so the same image can point at staging or
// production. Left empty here so `npm start` uses .env / the default.
window.__APP_CONFIG__ = {};
