package com.clinic.clinic_management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthConverter jwtAuthConverter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Cho phép công khai trang chủ, tệp tĩnh giao diện và các API xác thực
                .requestMatchers("/", "/index.html", "/assets/**", "/favicon.ico", "/*.svg").permitAll()
                .requestMatchers("/api/auth/**", "/dang-nhap", "/dang-ky", "/quen-mat-khau", "/dich-vu", "/gioi-thieu", "/lien-he").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/departments", "/api/services/**").permitAll()
                
                // Các API quản trị để Controller & Service tự kiểm tra thẩm quyền theo requesterId và JWT permissions
                .requestMatchers("/api/admin/**").permitAll()
                
                // Các API khác cho phép đi qua
                .anyRequest().permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter))
            );

        return http.build();
    }
}
