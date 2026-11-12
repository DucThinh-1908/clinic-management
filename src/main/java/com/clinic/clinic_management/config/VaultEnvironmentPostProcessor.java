package com.clinic.clinic_management.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class VaultEnvironmentPostProcessor implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();
        String vaultUri = env.getProperty("vault.uri", "http://localhost:8200");
        String vaultToken = env.getProperty("vault.token", "careplus-root-token");
        String secretPath = env.getProperty("vault.secret-path", "secret/data/clinic-management");

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(3))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(vaultUri + "/v1/" + secretPath))
                    .header("X-Vault-Token", vaultToken)
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String body = response.body();
                // Tìm phần "data":{"data":{ ... }} của KV v2 Engine
                int firstData = body.indexOf("\"data\"");
                int secondData = firstData != -1 ? body.indexOf("\"data\"", firstData + 6) : -1;
                if (secondData != -1) {
                    int startBrace = body.indexOf("{", secondData);
                    int endBrace = body.indexOf("}", startBrace);
                    if (startBrace != -1 && endBrace != -1) {
                        String innerJson = body.substring(startBrace + 1, endBrace);
                        Map<String, Object> vaultProps = new HashMap<>();
                        Matcher m = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"").matcher(innerJson);
                        while (m.find()) {
                            vaultProps.put(m.group(1), m.group(2));
                        }
                        if (!vaultProps.isEmpty()) {
                            env.getPropertySources().addFirst(new MapPropertySource("hashicorp-vault-secrets", vaultProps));
                            System.out.println("==========================================================");
                            System.out.println("[HashiCorp Vault] Da nap thanh cong " + vaultProps.size() + " secrets tu Vault: " + vaultProps.keySet());
                            System.out.println("==========================================================");
                        }
                    }
                }
            } else {
                System.err.println("[HashiCorp Vault] Khong the doc secret (HTTP " + response.statusCode() + "). Su dung cau hinh du phong.");
            }
        } catch (Exception e) {
            System.err.println("[HashiCorp Vault] Vault chua san sang (" + e.getMessage() + "). Su dung cau hinh du phong.");
        }
    }
}