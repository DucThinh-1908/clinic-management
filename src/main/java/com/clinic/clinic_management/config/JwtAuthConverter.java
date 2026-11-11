package com.clinic.clinic_management.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter defaultConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
                Stream.concat(
                        defaultConverter.convert(jwt).stream(),
                        extractRealmRoles(jwt).stream()
                ),
                extractPermissions(jwt).stream()
        ).collect(Collectors.toSet());

        return new JwtAuthenticationToken(jwt, authorities, getPrincipalClaimName(jwt));
    }

    private String getPrincipalClaimName(Jwt jwt) {
        String claimName = "preferred_username";
        return jwt.hasClaim(claimName) ? jwt.getClaimAsString(claimName) : jwt.getSubject();
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null || !realmAccess.containsKey("roles")) {
            return Collections.emptyList();
        }

        List<String> roles = (List<String>) realmAccess.get("roles");
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractPermissions(Jwt jwt) {
        Set<GrantedAuthority> perms = new HashSet<>();

        // 1. Check claim 'permissions' directly (from Protocol Mapper)
        if (jwt.hasClaim("permissions")) {
            Object permsClaim = jwt.getClaim("permissions");
            if (permsClaim instanceof List) {
                for (Object p : (List<?>) permsClaim) {
                    if (p != null) {
                        String permStr = p.toString();
                        perms.add(new SimpleGrantedAuthority(permStr));
                        perms.add(new SimpleGrantedAuthority("PERM_" + permStr));
                    }
                }
            }
        }

        // 2. Check client roles in 'resource_access.clinic-frontend.roles'
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null && resourceAccess.containsKey("clinic-frontend")) {
            Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get("clinic-frontend");
            if (clientAccess != null && clientAccess.containsKey("roles")) {
                List<String> clientRoles = (List<String>) clientAccess.get("roles");
                for (String cr : clientRoles) {
                    perms.add(new SimpleGrantedAuthority(cr));
                    perms.add(new SimpleGrantedAuthority("PERM_" + cr));
                }
            }
        }

        return perms;
    }
}
