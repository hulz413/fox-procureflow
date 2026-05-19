package com.foxprocureflow.config;

import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> { })
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/master-data/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/purchase-requests/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/purchase-requests/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/approvals/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/approvals/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/rfqs/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/rfqs/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/rfqs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/purchase-orders/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/purchase-orders/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/receipts/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/receipts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/invoices/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/invoices/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/receipts-invoices/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/attachments/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/attachments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/procurement-dashboard/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/three-way-matching/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/three-way-matching/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/ai-assistant/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/demo-data/reset").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .anyRequest().authenticated())
            .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
