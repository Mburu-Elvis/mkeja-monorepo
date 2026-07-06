package co.ke.mkeja.notification.realtime;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final WebSocketSessionManager sessionManager;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = (Long) session.getAttributes().get(WebSocketSessionManager.USER_ID_ATTR);
        if (userId == null) {
            try {
                session.close(CloseStatus.NOT_ACCEPTABLE);
            } catch (Exception e) {
                log.warn("Failed to close unauthorized WebSocket session: {}", e.getMessage());
            }
            return;
        }
        sessionManager.register(userId, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        if ("PING".equalsIgnoreCase(message.getPayload())) {
            try {
                session.sendMessage(new TextMessage("PONG"));
            } catch (Exception e) {
                log.debug("Failed to respond to WebSocket ping: {}", e.getMessage());
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessionManager.unregister(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.debug("WebSocket transport error sessionId={}: {}", session.getId(), exception.getMessage());
        sessionManager.unregister(session);
    }
}
