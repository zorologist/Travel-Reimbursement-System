/** Tests and development use the mock repository by default unless explicitly disabled via VITE_USE_DEVELOPMENT_REPOSITORY=false. */
export const useDevelopmentRepository =
  import.meta.env.MODE === "test"
  || (import.meta.env.DEV && import.meta.env.VITE_USE_DEVELOPMENT_REPOSITORY !== "false");

/** Production IIS builds restore the authenticated Windows user automatically. */
export const useWindowsAuthentication = import.meta.env.VITE_AUTH_MODE === "iis";

/** LDAP builds show the normal sign-in form, verified against Active Directory server-side. */
export const useDirectoryPasswordLogin = import.meta.env.VITE_AUTH_MODE === "ldap";
