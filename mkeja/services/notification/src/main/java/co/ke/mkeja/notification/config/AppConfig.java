package co.ke.mkeja.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class AppConfig {
    @Value("${app.sms.endpoint}")
    private String endpoint;

    @Value("${app.sms.api-key}")
    private String apiKey;


    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl(endpoint)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    @Bean
    HttpServiceProxyFactory httpServiceProxyFactory(final WebClient webClient) {
        return HttpServiceProxyFactory.builderFor(WebClientAdapter.create(webClient))
                .build();
    }
}
