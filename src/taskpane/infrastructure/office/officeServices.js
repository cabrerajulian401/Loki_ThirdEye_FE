import { ok } from "../../application/result";

/**
 * @returns {import("../../application/ports").ComposeService}
 */
export function createOfficeComposeService() {
  function openDraft({ to, subject, body } = {}) {
    const displayNewMessageForm = window.Office?.context?.mailbox?.displayNewMessageForm;
    if (displayNewMessageForm) {
      displayNewMessageForm({
        toRecipients: [to],
        subject,
        htmlBody: body.replace(/\n/g, "<br>"),
      });
      return ok({ via: "office" });
    }

    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    return ok({ via: "mailto" });
  }

  return { openDraft };
}

/**
 * @returns {import("../../application/ports").EmailContextService}
 */
export function createOfficeEmailContextService() {
  async function getOpenEmail() {
    const item = window.Office?.context?.mailbox?.item;
    if (!item) return null;
    return {
      messageId: item.itemId,
      conversationId: item.conversationId,
      sender: item.from?.displayName,
      senderEmail: item.from?.emailAddress,
      subject: item.subject,
    };
  }

  return { getOpenEmail };
}

/**
 * @param {{clientId: string, tenantId: string, fallback: import("../../application/ports").AuthService}} deps
 * @returns {import("../../application/ports").AuthService}
 */
export function createOfficeAuthService({ clientId, tenantId, fallback }) {
  let ssoToken = null;
  let warnedOnce = false;

  function warn(e) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn("officeAuthService: SSO sign-in failed, falling back to mock auth.", e);
    }
  }

  async function signIn() {
    try {
      if (typeof OfficeRuntime === "undefined" || !OfficeRuntime.auth) {
        throw new Error("OfficeRuntime.auth is not available");
      }
      // allowConsentPrompt raises Microsoft's one-time permission dialog on
      // first run; forMSGraphAccess marks the token for Overseer's
      // on-behalf-of Graph exchange (omit it and consent errors surface late).
      const token = await OfficeRuntime.auth.getAccessToken({
        allowSignInPrompt: true,
        allowConsentPrompt: true,
        forMSGraphAccess: true,
      });
      ssoToken = token;
      return ok({ user: { name: "Microsoft account" }, token });
    } catch (e) {
      warn(e);
      return fallback.signIn();
    }
  }

  function getToken() {
    return ssoToken || fallback.getToken();
  }

  function isSignedIn() {
    if (ssoToken) return true;
    return fallback.isSignedIn();
  }

  return { signIn, getToken, isSignedIn };
}
