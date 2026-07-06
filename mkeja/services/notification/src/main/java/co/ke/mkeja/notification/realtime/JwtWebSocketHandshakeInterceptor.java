package co.ke.mkeja.notification.realtime;

import co.ke.mkeja.notification.security.JwtProvider;
import co.ke.mkeja.notification.service.UserContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtProvider jwtProvider;
    private final UserContextService userContextService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        String token = servletRequest.getServletRequest().getParameter("token");
        if (token == null || token.isBlank() || !jwtProvider.isTokenValid(token)) {
            return false;
        }

        String phone = jwtProvider.getAuthentication(token).getName();
        Long userId = userContextService.loadUserIdByPhone(phone).orElse(null);
        if (userId == null) {
            return false;
        }

        attributes.put(WebSocketSessionManager.USER_ID_ATTR, userId);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
    }
}
