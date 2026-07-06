package co.ke.mkeja.discovery.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenExpired(String token) {
        return parseClaims(token).getExpiration().before(new java.util.Date());
    }

    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);
        String username = claims.getSubject();
        Collection<SimpleGrantedAuthority> authorities = parseRoles(claims.get("roles", String.class));
        AuthUser principal = new AuthUser(username, authorities);
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private Collection<SimpleGrantedAuthority> parseRoles(String rolesClaim) {
        if (rolesClaim == null || rolesClaim.isBlank()) {
            return java.util.List.of();
        }
        return Arrays.stream(rolesClaim.split(","))
                .map(String::trim)
                .filter(r -> !r.isBlank())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSigningKey() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters long");
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
