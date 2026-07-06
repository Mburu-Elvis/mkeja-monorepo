package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.response.UserProfileResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.repository.UserRepository;
import co.ke.mkeja.onboarding.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserProfileService userProfileService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(@AuthenticationPrincipal User principal) {
        User user = requireUser(principal);
        return userProfileService.buildProfile(user);
    }

    @GetMapping("/me/documents/{documentId}")
    public ResponseEntity<Resource> getMyDocument(@AuthenticationPrincipal User principal,
                                                  @PathVariable Long documentId) throws IOException {
        User user = requireUser(principal);
        userProfileService.assertUserOwnsDocument(user, documentId);
        Resource resource = userProfileService.loadDocument(documentId);
        String contentType = userProfileService.getDocumentContentType(documentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"document-" + documentId + "\"")
                .body(resource);
    }

    private User requireUser(User principal) {
        if (principal == null) {
            throw new BadRequestException("Not authenticated");
        }
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
