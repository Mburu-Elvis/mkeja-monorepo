package co.ke.mkeja.notification.controller;

import co.ke.mkeja.notification.dto.RegisterPushDeviceRequest;
import co.ke.mkeja.notification.dto.NotificationResponse;
import co.ke.mkeja.notification.dto.PlatformEventRequest;
import co.ke.mkeja.notification.dto.UnreadCountResponse;
import co.ke.mkeja.notification.engine.NotificationEngine;
import co.ke.mkeja.notification.security.AuthUser;
import co.ke.mkeja.notification.service.NotificationService;
import co.ke.mkeja.notification.service.PushDeviceService;
import co.ke.mkeja.notification.service.UserContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationEngine notificationEngine;
    private final PushDeviceService pushDeviceService;
    private final UserContextService userContextService;

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal AuthUser user) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        return notificationService.listForUser(userId);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal AuthUser user) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        return notificationService.unreadCount(userId);
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        return notificationService.markRead(userId, id);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(@AuthenticationPrincipal AuthUser user) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        notificationService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearAll(@AuthenticationPrincipal AuthUser user) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        notificationService.clearAll(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/devices")
    public ResponseEntity<Map<String, String>> registerDevice(@AuthenticationPrincipal AuthUser user,
                                                              @Valid @RequestBody RegisterPushDeviceRequest request) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        pushDeviceService.registerDevice(userId, request);
        return ResponseEntity.ok(Map.of("message", "Device registered"));
    }

    @DeleteMapping("/devices")
    public ResponseEntity<Void> unregisterDevice(@AuthenticationPrincipal AuthUser user,
                                                 @RequestParam String token) {
        Long userId = userContextService.requireUserIdByPhone(user.phone());
        pushDeviceService.unregisterDevice(userId, token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> ingestEvent(@Valid @RequestBody PlatformEventRequest event) {
        int delivered = notificationEngine.process(event);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("delivered", delivered, "eventId", event.getEventId()));
    }
}
