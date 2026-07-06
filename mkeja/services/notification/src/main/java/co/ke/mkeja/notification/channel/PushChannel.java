package co.ke.mkeja.notification.channel;

import co.ke.mkeja.notification.engine.NotificationDraft;
import co.ke.mkeja.notification.model.entity.Notification;
import co.ke.mkeja.notification.model.entity.PushDeviceToken;
import co.ke.mkeja.notification.repository.PushDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PushChannel {

    private final PushDeviceTokenRepository pushDeviceTokenRepository;

    public void deliver(NotificationDraft draft, Notification notification) {
        if (draft.userId() == null) {
            return;
        }

        var tokens = pushDeviceTokenRepository.findByUserIdAndActiveTrue(draft.userId());
        if (tokens.isEmpty()) {
            log.debug("No push tokens registered for userId={}", draft.userId());
            return;
        }

        for (PushDeviceToken device : tokens) {
            log.info("Push stub: platform={} token={} title={} body={}",
                    device.getPlatform(),
                    maskToken(device.getToken()),
                    draft.title(),
                    draft.message());
        }
    }

    private String maskToken(String token) {
        if (token == null || token.length() < 8) {
            return "****";
        }
        return token.substring(0, 4) + "..." + token.substring(token.length() - 4);
    }
}
