package co.ke.mkeja.notification.engine;

import co.ke.mkeja.notification.channel.EmailChannel;
import co.ke.mkeja.notification.channel.InAppChannel;
import co.ke.mkeja.notification.channel.PushChannel;
import co.ke.mkeja.notification.channel.SmsChannel;
import co.ke.mkeja.notification.channel.WebChannel;
import co.ke.mkeja.notification.dto.PlatformEventRequest;
import co.ke.mkeja.notification.dto.SmsResponse;
import co.ke.mkeja.notification.model.entity.Notification;
import co.ke.mkeja.notification.model.enums.DeliveryChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationEngine {

    private final EventRecipientResolver recipientResolver;
    private final InAppChannel inAppChannel;
    private final WebChannel webChannel;
    private final PushChannel pushChannel;
    private final SmsChannel smsChannel;
    private final EmailChannel emailChannel;

    @Transactional
    public int process(PlatformEventRequest event) {
        List<NotificationDraft> drafts = recipientResolver.resolve(event);
        if (drafts.isEmpty()) {
            log.debug("No notification drafts for event type={}", event.getEventType());
            return 0;
        }

        int delivered = 0;
        for (NotificationDraft draft : drafts) {
            if (dispatch(draft, event)) {
                delivered++;
            }
        }

        log.info("Processed event type={} eventId={} notifications={}", event.getEventType(), event.getEventId(), delivered);
        return delivered;
    }

    private boolean dispatch(NotificationDraft draft, PlatformEventRequest event) {
        Set<DeliveryChannel> channels = draft.channels();
        if (channels == null || channels.isEmpty()) {
            channels = ChannelSets.INBOX;
        }

        Optional<Notification> saved = Optional.empty();
        if (channels.contains(DeliveryChannel.IN_APP)) {
            saved = inAppChannel.deliver(draft, event);
        }

        Notification notification = saved.orElse(null);
        if (notification == null && channels.contains(DeliveryChannel.WEB)) {
            log.debug("Skipping web delivery without persisted notification for userId={}", draft.userId());
        }

        if (channels.contains(DeliveryChannel.WEB) && notification != null) {
            webChannel.deliver(draft, notification);
        }
        if (channels.contains(DeliveryChannel.PUSH)) {
            pushChannel.deliver(draft, notification);
        }
        if (channels.contains(DeliveryChannel.SMS)) {
            smsChannel.deliver(draft);
        }
        if (channels.contains(DeliveryChannel.EMAIL)) {
            emailChannel.deliver(draft);
        }

        return draft.userId() != null;
    }

    public SmsResponse processCallback(SmsResponse response) {
        log.info("SMS callback: {}", response);
        return response;
    }
}
