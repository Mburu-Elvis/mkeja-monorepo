package co.ke.mkeja.notification.service;

import co.ke.mkeja.notification.dto.RegisterPushDeviceRequest;
import co.ke.mkeja.notification.exception.BadRequestException;
import co.ke.mkeja.notification.model.entity.PushDeviceToken;
import co.ke.mkeja.notification.repository.PushDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PushDeviceService {

    private final PushDeviceTokenRepository pushDeviceTokenRepository;

    @Transactional
    public void registerDevice(Long userId, RegisterPushDeviceRequest request) {
        String token = request.getToken().trim();
        String platform = request.getPlatform().trim().toUpperCase();

        if (token.isBlank()) {
            throw new BadRequestException("Device token is required");
        }

        PushDeviceToken device = pushDeviceTokenRepository.findByToken(token)
                .orElseGet(PushDeviceToken::new);
        device.setUserId(userId);
        device.setToken(token);
        device.setPlatform(platform);
        device.setActive(true);
        pushDeviceTokenRepository.save(device);
    }

    @Transactional
    public void unregisterDevice(Long userId, String token) {
        pushDeviceTokenRepository.deleteByUserIdAndToken(userId, token.trim());
    }
}
