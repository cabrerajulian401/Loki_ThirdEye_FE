/**
 * App-wide context: exposes the controller's `{nav, otto, data, actions}`
 * shape (see `useAppController.js`) to every screen/component below `App`.
 * Presentation components never talk to use cases directly — they read
 * `useApp()` and call the actions it hands back.
 */
import * as React from "react";

export const AppContext = React.createContext(null);

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp() must be used within an <AppContext.Provider> (see App.jsx)");
  }
  return ctx;
}
