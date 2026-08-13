import { Client } from "ldapts";

import { directoryConfig } from "../auth/directoryConfig.js";

// One-off diagnostic: dump every LDAP attribute Active Directory has for one
// account, so we know exactly what's available before designing a bulk sync.
// Usage: db:inspect-ldap-user -- <username> <password> [account-to-look-up]

const [username, password, lookupTarget] = process.argv.slice(2);
if (!username || !password) {
  throw new Error("Usage: db:inspect-ldap-user -- <username> <password> [account-to-look-up]");
}

const { url, domain } = directoryConfig();
const bindDn = username.includes("@") ? username : `${username}@${domain}`;
const target = (lookupTarget ?? username).trim();

const client = new Client({ url, connectTimeout: 5_000, timeout: 5_000 });
try {
  await client.bind(bindDn, password);
  const base = domain.split(".").map((part) => `dc=${part}`).join(",");
  const { searchEntries } = await client.search(base, {
    scope: "sub",
    filter: `(sAMAccountName=${target})`,
    attributes: ["*"],
  });
  if (searchEntries.length === 0) {
    console.log(`No AD entry found for sAMAccountName=${target}.`);
  } else {
    console.log(JSON.stringify(searchEntries[0], null, 2));
  }
} finally {
  await client.unbind().catch(() => {});
}
