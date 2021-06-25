package com.DocSystem.test;

import org.acegisecurity.ldap.DefaultInitialDirContextFactory;
import org.acegisecurity.ldap.search.FilterBasedLdapUserSearch;
import org.acegisecurity.providers.ldap.authenticator.BindAuthenticator;
import org.acegisecurity.userdetails.UsernameNotFoundException;
import org.acegisecurity.userdetails.ldap.LdapUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;

@Component
public class LdapAuthenticationManager implements AuthenticationManager {

	private static Logger logger = LoggerFactory.getLogger(LdapAuthenticationManager.class);
	private Ldap ldap = new Ldap();

	class Ldap {

		private Logger logger = LoggerFactory.getLogger(Ldap.class);
		private FilterBasedLdapUserSearch userSearcher;

		{
			DefaultInitialDirContextFactory context = new DefaultInitialDirContextFactory("ldap://ed-p-gl.emea.nsn-net.net:389/o=NSN");
			BindAuthenticator binder = new BindAuthenticator(context);
			userSearcher = new FilterBasedLdapUserSearch("", "uid={0}", context);
			userSearcher.setSearchSubtree(true);
			binder.setUserSearch(userSearcher);
		}

		LdapUserDetails getLdapUserDetail(String userId) {
			try {
				return userSearcher.searchForUser(userId);
			}
			catch (UsernameNotFoundException e) {
				return null;
			}
		}

	}

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		return new UsernamePasswordAuthenticationToken(ldap.getLdapUserDetail(authentication.getName()).getUsername(), authentication.getCredentials(), getAuthorities(authentication.getName()));
	}

	public static Collection<? extends GrantedAuthority> getAuthorities(String username) {
		ArrayList<GrantedAuthority> authorities = new ArrayList<>();
		String access =  getAuthority(username);
		logger.info("User [{}] has role: {}", username, access);
		SimpleGrantedAuthority authority = new SimpleGrantedAuthority(access);
		authorities.add(authority);
		return authorities;
	}
	private static String getAuthority(String userId){
		return "private";
	}
}


