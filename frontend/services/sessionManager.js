import { secureStorage } from "./secureStorage";
import { platformTokenStorage } from "./platformTokenStorage";

const listeners = new Set();
let expirationTask = null;
let sessionExpired = false;

export const subscribeToSessionExpiry = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const markSessionActive = () => {
  sessionExpired = false;
};

export const expireSession = async (reason = "expired") => {
  if (sessionExpired) return;
  if (expirationTask) return expirationTask;
  sessionExpired = true;

  expirationTask = (async () => {
    await Promise.allSettled([
      secureStorage.removeItem("userToken"),
      secureStorage.removeItem("userData"),
      platformTokenStorage.clear(),
    ]);
    listeners.forEach((listener) => {
      try {
        listener(reason);
      } catch {
        // One UI listener must not prevent the remaining listeners from running.
      }
    });
  })();

  try {
    await expirationTask;
  } finally {
    expirationTask = null;
  }
};
