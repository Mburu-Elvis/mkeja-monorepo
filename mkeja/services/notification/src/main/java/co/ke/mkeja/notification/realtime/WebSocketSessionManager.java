package co.ke.mkeja.notification.realtime;

import co.ke.mkeja.notification.dto.NotificationResponse;
import co.ke.mkeja.notification.dto.RealtimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class WebSocketSessionManager {

    public static final String USER_ID_ATTR = "userId";

    private final Map<Long, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();
    private final Map<String, Long> userBySessionId = new ConcurrentHashMap<>();

    public void register(Long userId, WebSocketSession session) {
        sessionsByUser.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
        userBySessionId.put(session.getId(), userId);
        log.debug("WebSocket connected userId={} sessionId={}", userId, session.getId());
    }

    public void unregister(WebSocketSession session) {
        Long userId = userBySessionId.remove(session.getId());
        if (userId == null) {
            return;
        }
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                sessionsByUser.remove(userId);
            }
        }
        log.debug("WebSocket disconnected userId={} sessionId={}", userId, session.getId());
    }

    public void sendToUser(Long userId, RealtimeMessage message) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        String payload = toJson(message);
        TextMessage textMessage = new TextMessage(payload);
        for (WebSocketSession session : Set.copyOf(sessions)) {
            if (!session.isOpen()) {
                unregister(session);
                continue;
            }
            try {
                session.sendMessage(textMessage);
            } catch (IOException e) {
                log.warn("Failed to send WebSocket message to session {}: {}", session.getId(), e.getMessage());
                unregister(session);
            }
        }
    }

    public boolean isUserOnline(Long userId) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    private String toJson(RealtimeMessage message) {
        if ("NOTIFICATION".equals(message.getType()) && message.getPayload() instanceof NotificationResponse notification) {
            return "{"
                    + "\"type\":\"NOTIFICATION\","
                    + "\"payload\":{"
                    + "\"id\":" + notification.getId() + ","
                    + "\"title\":\"" + escape(notification.getTitle()) + "\","
                    + "\"message\":\"" + escape(notification.getMessage()) + "\","
                    + "\"type\":\"" + escape(notification.getType()) + "\","
                    + "\"category\":\"" + escape(notification.getCategory()) + "\","
                    + "\"read\":" + notification.isRead() + ","
                    + "\"link\":" + nullableString(notification.getLink()) + ","
                    + "\"createdAt\":\"" + notification.getCreatedAt() + "\""
                    + "}"
                    + "}";
        }

        if ("UNREAD_COUNT".equals(message.getType()) && message.getPayload() instanceof Map<?, ?> payload) {
            Object count = payload.get("count");
            return "{\"type\":\"UNREAD_COUNT\",\"payload\":{\"count\":" + count + "}}";
        }

        return "{\"type\":\"" + escape(message.getType()) + "\"}";
    }

    private String nullableString(String value) {
        return value == null ? "null" : "\"" + escape(value) + "\"";
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
