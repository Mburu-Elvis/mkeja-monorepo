package co.ke.mkeja.notification.channel;

import co.ke.mkeja.notification.dto.SmsRequest;
import co.ke.mkeja.notification.dto.SmsResponse;
import co.ke.mkeja.notification.engine.NotificationDraft;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class SmsChannel {

    private final EntityManager entityManager;
    private static final String DATA_POOL = "0123456789abcdefghijklmnopqrstuvwxyz";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int ID_LENGTH = 10;
    private final WebClient webClient;

    @Value("${app.sms.api-key}")
    private String apiKey;

    public void deliver(NotificationDraft draft) {
        if (draft.userId() == null) {
            return;
        }
        String phone = loadPhone(draft.userId());
        if (phone == null) {
            return;
        }
        SmsRequest request = buildRequestBody(phone, draft);
        try {
            log.info("Sending SMS to: {} with: {}", phone, draft);
            SmsResponse response = webClient.post()
                    .uri("/api/messaging/sendsms")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> Mono.error(
                                            new RuntimeException(
                                                    "SMS API error: " + errorBody))))
                    .bodyToMono(SmsResponse.class)
                    .block();
            log.info("SMS response: {}", response);
        } catch (Exception e) {
            log.error("Failed to send SMS", e);
        }
        log.info("SMS stub: to={} title={} message={}", phone, draft.title(), draft.message());
    }

    private String loadPhone(Long userId) {
        String sql = "SELECT u.phone FROM tbl_users u WHERE u.id = :userId";
        try {
            return String.valueOf(entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult());
        } catch (NoResultException e) {
            return null;
        }
    }

    public Mono<String> sendSms() {
        return webClient.get()
                .uri("/data")
                .retrieve()
                .bodyToMono(String.class);
    }

    public SmsRequest buildRequestBody(String phone, NotificationDraft draft) {
        SmsRequest request = new SmsRequest();
        request.setTo(phone);
        request.setMessage(draft.message());
        request.setRefId(generateRefId());
        return request;
    }

    public static String generateRefId() {
        return RANDOM.ints(ID_LENGTH, 0, DATA_POOL.length())
                .mapToObj(DATA_POOL::charAt)
                .map(Object::toString)
                .collect(Collectors.joining());
    }
}
