import logging
import re
from ldap3 import Server, Connection, ALL, SUBTREE
from ldap3.core.exceptions import LDAPException, LDAPSocketOpenError, LDAPBindError

from config import (
    LDAP_SERVER_URL,
    LDAP_BASE_DN,
    LDAP_USER_SEARCH_BASE,
    LDAP_GROUP_SEARCH_BASE,
    LDAP_BIND_DN,
    LDAP_BIND_PASSWORD,
    LDAP_USER_DN_TEMPLATE,
)

logger = logging.getLogger(__name__)


class LDAPClient:
    """
    Client for authenticating users and querying roles and user counts
    against Authentik's LDAP Outpost or standard LDAP/Active Directory.
    """

    def __init__(self):
        self.server_url = LDAP_SERVER_URL
        self.base_dn = LDAP_BASE_DN
        self.user_search_base = LDAP_USER_SEARCH_BASE or f"ou=users,{self.base_dn}"
        self.group_search_base = LDAP_GROUP_SEARCH_BASE or f"ou=groups,{self.base_dn}"
        self.bind_dn = LDAP_BIND_DN
        self.bind_password = LDAP_BIND_PASSWORD
        self.user_dn_template = LDAP_USER_DN_TEMPLATE

    def _get_server(self, timeout: int = 10) -> Server:
        return Server(self.server_url, get_info=None, connect_timeout=timeout)

    @staticmethod
    def _escape_filter_chars(text: str) -> str:
        """Escapes characters in LDAP filter expressions per RFC 4515."""
        escape_map = {
            '\\': r'\5c',
            '*': r'\2a',
            '(': r'\28',
            ')': r'\29',
            '\0': r'\00',
        }
        return ''.join(escape_map.get(c, c) for c in text)

    def is_healthy(self) -> bool:
        """Checks if the LDAP server is reachable."""
        try:
            server = self._get_server(timeout=2)
            conn = Connection(server, auto_bind=False)
            conn.open()
            is_open = conn.bound or conn.listening or server.check_availability()
            conn.unbind()
            return is_open
        except Exception as e:
            logger.debug(f"LDAP healthcheck failed: {e}")
            return False

    def authenticate(self, username: str, password: str) -> dict | None:
        """
        Authenticates a user against LDAP and resolves their role based on LDAP groups.
        Returns a dict with username, role, groups, and DN if successful, or None.
        """
        if not username or not password:
            return None

        safe_username = self._escape_filter_chars(username)
        server = self._get_server()

        user_dn = None
        user_groups = set()

        # If a service account is configured, search for the user's actual DN and attributes
        if self.bind_dn and self.bind_password:
            try:
                with Connection(server, user=self.bind_dn, password=self.bind_password, auto_bind=True) as conn:
                    search_filter = f"(|(cn={safe_username})(sAMAccountName={safe_username})(uid={safe_username}))"
                    conn.search(
                        search_base=self.user_search_base,
                        search_filter=search_filter,
                        search_scope=SUBTREE,
                        attributes=["cn", "memberOf", "sAMAccountName", "uid"]
                    )
                    if conn.entries:
                        entry = conn.entries[0]
                        user_dn = entry.entry_dn
                        if "memberOf" in entry:
                            for grp in entry.memberOf.values:
                                m = re.search(r"cn=([^,]+)", str(grp), re.IGNORECASE)
                                if m:
                                    user_groups.add(m.group(1).lower())
                                else:
                                    user_groups.add(str(grp).lower())
            except Exception as e:
                logger.warning(f"LDAP service account bind/search failed: {e}")

        # If user_dn was not discovered via service account, use the template
        candidate_dns = []
        if user_dn:
            candidate_dns.append(user_dn)
        else:
            try:
                candidate_dns.append(self.user_dn_template.format(username=safe_username, base_dn=self.base_dn))
            except Exception:
                pass
            candidate_dns.append(f"cn={safe_username},{self.user_search_base}")
            candidate_dns.append(f"uid={safe_username},{self.user_search_base}")
            candidate_dns.append(f"cn={safe_username},{self.base_dn}")

        # Attempt user bind with user DN candidates
        authenticated_conn = None
        bound_dn = None

        for candidate in candidate_dns:
            try:
                conn = Connection(server, user=candidate, password=password)
                if conn.bind():
                    authenticated_conn = conn
                    bound_dn = candidate
                    break
            except (LDAPSocketOpenError, LDAPException) as e:
                logger.warning(f"LDAP connection/bind error for candidate {candidate}: {e}")
                continue

        if not authenticated_conn:
            logger.info(f"LDAP authentication failed for user '{username}'")
            return None

        # Fetch group memberships if not already discovered
        try:
            if not user_groups:
                # First, check the user entry itself
                authenticated_conn.search(
                    search_base=bound_dn,
                    search_filter="(objectClass=*)",
                    search_scope=SUBTREE,
                    attributes=["memberOf"]
                )
                if authenticated_conn.entries and "memberOf" in authenticated_conn.entries[0]:
                    for grp in authenticated_conn.entries[0].memberOf.values:
                        m = re.search(r"cn=([^,]+)", str(grp), re.IGNORECASE)
                        if m:
                            user_groups.add(m.group(1).lower())
                        else:
                            user_groups.add(str(grp).lower())

            # Also query group objects directly in the directory
            group_filter = f"(|(member={bound_dn})(memberUid={safe_username})(uniqueMember={bound_dn}))"
            authenticated_conn.search(
                search_base=self.group_search_base,
                search_filter=group_filter,
                search_scope=SUBTREE,
                attributes=["cn"]
            )
            for grp in authenticated_conn.entries:
                if "cn" in grp:
                    user_groups.add(str(grp.cn.value).lower())
        except Exception as e:
            logger.warning(f"Error querying LDAP groups for '{username}': {e}")
        finally:
            try:
                authenticated_conn.unbind()
            except Exception:
                pass

        # Map groups to roles
        role = self._resolve_role(user_groups)
        logger.info(f"User '{username}' authenticated successfully via LDAP with role '{role}' (groups: {list(user_groups)})")

        return {
            "username": username,
            "dn": bound_dn,
            "groups": list(user_groups),
            "role": role,
        }

    def _resolve_role(self, groups: set[str]) -> str:
        """
        Maps LDAP group names to OPA application roles (admin, curator, user).
        Priority: admin > curator > user.
        """
        admin_names = {"admin", "admins", "authentik admins", "administrator", "administrators"}
        curator_names = {"curator", "curators", "data_curator", "data_curators"}

        for g in groups:
            if g in admin_names:
                return "admin"
            elif g in curator_names:
                return "curator"
        return "user"

    def get_user_count(self) -> int:
        """Returns the total number of users found in LDAP."""
        server = self._get_server(timeout=10)
        try:
            bind_user = self.bind_dn if self.bind_dn else None
            bind_pwd = self.bind_password if self.bind_dn else None
            conn = (
                Connection(server, user=bind_user, password=bind_pwd, auto_bind=True, receive_timeout=10)
                if bind_user
                else Connection(server, auto_bind=True, receive_timeout=10)
            )

            search_filter = "(&(objectClass=user)(!(cn=ak-outpost*)))"
            conn.search(
                search_base=self.user_search_base,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=["cn"]
            )
            count = len(conn.entries)
            conn.unbind()
            return count
        except Exception as e:
            logger.warning(f"Could not retrieve user count from LDAP: {e}")
            return 0


ldap_client = LDAPClient()
