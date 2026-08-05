export interface DirectoryConfig {
  url: string;
  domain: string;
}

export function directoryConfig(environment: NodeJS.ProcessEnv = process.env): DirectoryConfig {
  const url = environment.LDAP_URL?.trim() || "ldap://192.168.1.9:389";
  const domain = environment.LDAP_DOMAIN?.trim() || "EGAS.Local";
  return { url, domain };
}
