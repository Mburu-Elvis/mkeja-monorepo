package co.ke.mkeja.notification.engine;

import co.ke.mkeja.notification.model.enums.DeliveryChannel;

import java.util.EnumSet;
import java.util.Set;

public final class ChannelSets {

    public static final Set<DeliveryChannel> INBOX = EnumSet.of(
            DeliveryChannel.IN_APP,
            DeliveryChannel.WEB
    );

    public static final Set<DeliveryChannel> INBOX_PUSH = EnumSet.of(
            DeliveryChannel.IN_APP,
            DeliveryChannel.WEB,
            DeliveryChannel.PUSH
    );

    public static final Set<DeliveryChannel> INBOX_SMS = EnumSet.of(
            DeliveryChannel.IN_APP,
            DeliveryChannel.WEB,
            DeliveryChannel.SMS
    );

    public static final Set<DeliveryChannel> INBOX_PUSH_SMS = EnumSet.of(
            DeliveryChannel.IN_APP,
            DeliveryChannel.WEB,
            DeliveryChannel.PUSH,
            DeliveryChannel.SMS
    );

    public static final Set<DeliveryChannel> FULL = EnumSet.of(
            DeliveryChannel.IN_APP,
            DeliveryChannel.WEB,
            DeliveryChannel.PUSH,
            DeliveryChannel.SMS,
            DeliveryChannel.EMAIL
    );

    private ChannelSets() {
    }
}
