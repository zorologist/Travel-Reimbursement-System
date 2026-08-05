/** Tests and an explicit opt-in may use the browser repository; normal development uses the backend API. */
export const useDevelopmentRepository =
  import.meta.env.MODE === "test"
  || (import.meta.env.DEV && import.meta.env.VITE_USE_DEVELOPMENT_REPOSITORY === "true");

/** Production IIS builds restore the authenticated Windows user automatically. */
export const useWindowsAuthentication = import.meta.env.VITE_AUTH_MODE === "iis";

/** LDAP builds show the normal sign-in form, verified against Active Directory server-side. */
export const useDirectoryPasswordLogin = import.meta.env.VITE_AUTH_MODE === "ldap";
