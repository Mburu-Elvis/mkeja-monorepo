package co.ke.mkeja.discovery.config;

import co.ke.mkeja.discovery.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/discovery/properties").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/discovery/properties/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/discovery/listings/**").permitAll()
                        .requestMatchers("/api/v1/discovery/preferences").hasRole("TENANT")
                        .requestMatchers("/api/v1/discovery/saved/**").hasRole("TENANT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/discovery/listings/*/public-interest").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/discovery/listings/*/interest").hasRole("TENANT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/discovery/listings/*/save").hasRole("TENANT")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/discovery/listings/*/save").hasRole("TENANT")
                        .requestMatchers("/api/v1/discovery/recommendations").hasRole("TENANT")
                        .requestMatchers("/api/v1/discovery/leads/**").hasAnyRole("PROPERTY_OWNER", "AGENT")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
