/**
 * Meta (Facebook) JavaScript SDK Service
 * Handles official OAuth 2.0 popup login, graph API profile fetching,
 * pages retrieval, and lead forms synchronization.
 */

const DEFAULT_SCOPES = [
  "public_profile",
  "leads_retrieval",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_ads",
].join(",");

let sdkLoadingPromise = null;

/**
 * Dynamically loads and initializes the official Meta Facebook JavaScript SDK.
 * Reads App ID from VITE_META_APP_ID environment variable.
 */
export function initFacebookSdk(appIdOverride = null) {
  const appId = appIdOverride || import.meta.env.VITE_META_APP_ID;

  if (typeof window !== "undefined" && window.FB && typeof window.FB.login === "function") {
    return Promise.resolve(window.FB);
  }

  if (sdkLoadingPromise) {
    return sdkLoadingPromise;
  }

  sdkLoadingPromise = new Promise((resolve, reject) => {
    // If no App ID is configured yet
    if (!appId) {
      console.warn(
        "[Meta SDK] VITE_META_APP_ID is not configured in .env. Live Facebook OAuth popup requires a Meta App ID."
      );
    }

    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: appId || "0",
          cookie: true,
          xfbml: true,
          version: "v21.0",
        });
        resolve(window.FB);
      } catch (err) {
        console.error("[Meta SDK] Failed to init FB:", err);
        reject(err);
      }
    };

    // Load SDK script if not already in document
    const scriptId = "facebook-jssdk";
    if (document.getElementById(scriptId)) {
      if (window.FB) resolve(window.FB);
      return;
    }

    const js = document.createElement("script");
    js.id = scriptId;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.async = true;
    js.defer = true;
    js.crossOrigin = "anonymous";
    js.onerror = (err) => {
      console.error("[Meta SDK] Failed to load Facebook SDK script (ad-blocker may be active):", err);
      reject(new Error("Failed to load Meta SDK. Please check your internet connection or disable ad-blockers."));
    };

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(js, firstScript);
    } else {
      document.head.appendChild(js);
    }
  });

  return sdkLoadingPromise;
}

/**
 * Triggers the official Facebook Login popup window.
 * User enters their real Facebook email and password.
 * 
 * @param {Object} options
 * @param {boolean} [options.reauthenticate=false] - If true, forces user to choose or login to another Facebook account
 * @param {string} [options.scope] - Permissions to request
 * @returns {Promise<Object>} authResponse with accessToken, userID, etc.
 */
export async function loginWithFacebook({ reauthenticate = false, scope = DEFAULT_SCOPES } = {}) {
  const appId = import.meta.env.VITE_META_APP_ID;
  if (!appId) {
    throw new Error(
      "Meta App ID missing: Please configure VITE_META_APP_ID in your .env file to enable live Facebook login."
    );
  }

  await initFacebookSdk(appId);

  return new Promise((resolve, reject) => {
    if (!window.FB) {
      return reject(new Error("Meta Facebook SDK is not loaded."));
    }

    const loginOptions = {
      scope,
      return_scopes: true,
      auth_type: reauthenticate ? "reauthenticate" : undefined,
    };

    window.FB.login((response) => {
      if (response && response.authResponse) {
        resolve(response.authResponse);
      } else {
        const errorMsg = response?.status === "not_authorized"
          ? "You did not authorize the required Meta permissions."
          : "Facebook login was cancelled or closed.";
        reject(new Error(errorMsg));
      }
    }, loginOptions);
  });
}

/**
 * Fetches the authenticated user's Facebook profile (Name, Email, Picture)
 * via Meta Graph API /me
 */
export async function getFacebookProfile() {
  await initFacebookSdk();

  return new Promise((resolve, reject) => {
    if (!window.FB) return reject(new Error("FB SDK not available"));

    window.FB.api(
      "/me",
      { fields: "id,name,email,picture.width(200).height(200)" },
      (response) => {
        if (!response || response.error) {
          return reject(response?.error || new Error("Failed to fetch Facebook profile."));
        }
        resolve({
          id: response.id,
          name: response.name,
          email: response.email || "",
          avatar: response.picture?.data?.url || "",
        });
      }
    );
  });
}

/**
 * Fetches all Facebook Pages managed by the authenticated user
 * via Meta Graph API /me/accounts
 */
export async function getFacebookPages() {
  await initFacebookSdk();

  return new Promise((resolve, reject) => {
    if (!window.FB) return reject(new Error("FB SDK not available"));

    window.FB.api(
      "/me/accounts",
      { fields: "id,name,category,access_token,tasks,picture" },
      (response) => {
        if (!response || response.error) {
          return reject(response?.error || new Error("Failed to fetch Facebook pages."));
        }
        const pages = (response.data || []).map((page) => ({
          id: page.id,
          name: page.name,
          category: page.category || "Business Page",
          pageAccessToken: page.access_token,
          avatar: page.picture?.data?.url || "",
        }));
        resolve(pages);
      }
    );
  });
}

/**
 * Fetches Instant Lead Forms for a given Facebook Page
 * via Meta Graph API /{page-id}/leadgen_forms
 * 
 * @param {string} pageId - Facebook Page ID
 * @param {string} [pageAccessToken] - Page access token
 */
export async function getFacebookPageForms(pageId, pageAccessToken) {
  await initFacebookSdk();

  return new Promise((resolve, reject) => {
    if (!window.FB) return reject(new Error("FB SDK not available"));

    const params = {
      fields: "id,name,status,leads_count,created_time",
    };
    if (pageAccessToken) {
      params.access_token = pageAccessToken;
    }

    window.FB.api(`/${pageId}/leadgen_forms`, params, (response) => {
      if (!response || response.error) {
        console.warn("[Meta SDK] Could not fetch forms via client Graph API:", response?.error);
        return resolve([]);
      }
      const forms = (response.data || []).map((form) => ({
        id: form.id,
        name: form.name,
        leadCount: form.leads_count || 0,
        status: (form.status || "active").toLowerCase(),
      }));
      resolve(forms);
    });
  });
}
