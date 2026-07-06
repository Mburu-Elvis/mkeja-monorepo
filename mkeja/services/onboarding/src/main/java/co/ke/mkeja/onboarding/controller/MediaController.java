package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.service.PropertyImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final PropertyImageService propertyImageService;

    @GetMapping("/{storageKey}")
    public ResponseEntity<Resource> getMedia(@PathVariable String storageKey) throws IOException {
        Resource resource = propertyImageService.loadMedia(storageKey);
        String contentType = propertyImageService.contentType(storageKey);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(resource);
    }
}
