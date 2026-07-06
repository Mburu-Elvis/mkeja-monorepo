package co.ke.mkeja.onboarding.config;

import co.ke.mkeja.onboarding.security.jwt.JwtAutFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

    private final JwtAutFilter jwtAutFilter;
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
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/invitations/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/media/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/invitations/*/accept").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/onboarding/landlords").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/onboarding/landlords/*/documents").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/onboarding/agents").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/onboarding/agents/**").permitAll()
                        .requestMatchers("/api/v1/onboarding/tenants/**").permitAll()
                        .requestMatchers("/api/v1/properties/**").hasAnyRole("PROPERTY_OWNER", "AGENT")
                        .requestMatchers("/api/v1/landlord/**").hasAnyRole("PROPERTY_OWNER", "AGENT")
                        .requestMatchers("/api/v1/tenant/**").hasRole("TENANT")
                        .requestMatchers("/api/v1/profile/**").authenticated()
                        .requestMatchers("/api/v1/support/**").authenticated()
                        .requestMatchers("/api/v1/admin/admins/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/invitations").hasAnyRole("PROPERTY_OWNER", "AGENT")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAutFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
