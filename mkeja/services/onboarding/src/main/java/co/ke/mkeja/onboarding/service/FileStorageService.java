package co.ke.mkeja.onboarding.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.kyc.upload-dir:./uploads/kyc}") String uploadDir) throws IOException {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadRoot);
    }

    public String storeMultipart(MultipartFile file, String prefix) throws IOException {
        String extension = getExtension(file.getOriginalFilename());
        String storageKey = prefix + "_" + UUID.randomUUID() + extension;
        Path target = uploadRoot.resolve(storageKey);
        Files.copy(file.getInputStream(), target);
        return storageKey;
    }

    public String storeBase64(String dataUrl, String prefix) throws IOException {
        String[] parts = dataUrl.split(",");
        String meta = parts[0];
        String base64 = parts.length > 1 ? parts[1] : parts[0];
        String extension = meta.contains("pdf") ? ".pdf" : meta.contains("png") ? ".png" : ".jpg";
        String storageKey = prefix + "_" + UUID.randomUUID() + extension;
        byte[] bytes = Base64.getDecoder().decode(base64);
        Files.write(uploadRoot.resolve(storageKey), bytes);
        return storageKey;
    }

    public Path resolve(String storageKey) {
        return uploadRoot.resolve(storageKey).normalize();
    }

    public Resource loadAsResource(String storageKey) throws IOException {
        Path file = resolve(storageKey);
        if (!Files.exists(file)) {
            throw new IOException("File not found: " + storageKey);
        }
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new IOException("File not readable: " + storageKey);
        }
        return resource;
    }

    public String probeContentType(String storageKey) throws IOException {
        Path file = resolve(storageKey);
        String contentType = Files.probeContentType(file);
        return contentType != null ? contentType : "application/octet-stream";
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".bin";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    public void delete(String storageKey) throws IOException {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        Path file = resolve(storageKey);
        Files.deleteIfExists(file);
    }
}
