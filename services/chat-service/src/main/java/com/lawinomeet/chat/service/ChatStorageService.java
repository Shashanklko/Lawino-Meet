package com.lawinomeet.chat.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
public class ChatStorageService {

    @Value("${app.s3.bucket-name:lawinomeet-assests}")
    private String bucketName;

    @Value("${app.s3.region:us-east-1}")
    private String region;

    @Value("${app.s3.access-key:}")
    private String accessKey;

    @Value("${app.s3.secret-key:}")
    private String secretKey;

    @Value("${app.storage.local-dir:./uploads}")
    private String localStorageDir;

    @Getter
    @RequiredArgsConstructor
    public static class DownloadedFile {
        private final byte[] data;
        private final String contentType;
        private final String filename;
    }

    public StoredAttachment storeAttachment(MultipartFile file, String conversationPublicId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String cleanFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String uniqueFileName = UUID.randomUUID().toString().substring(0, 8) + "_" + cleanFilename;
        String s3Key = "chat/" + conversationPublicId + "/" + uniqueFileName;
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        long size = file.getSize();

        String url = null;
        if (isS3Configured()) {
            try {
                url = uploadToS3(file, s3Key, contentType);
            } catch (Exception e) {
                log.warn("S3 upload failed for chat document, falling back to local storage: {}", e.getMessage());
                url = uploadToLocalStorage(file, "chat/" + conversationPublicId, uniqueFileName);
            }
        } else {
            url = uploadToLocalStorage(file, "chat/" + conversationPublicId, uniqueFileName);
        }

        return new StoredAttachment(url, cleanFilename, contentType, size);
    }

    private boolean isS3Configured() {
        return bucketName != null && !bucketName.trim().isEmpty();
    }

    private AwsCredentialsProvider resolveCredentialsProvider() {
        if (accessKey != null && !accessKey.trim().isEmpty() &&
            secretKey != null && !secretKey.trim().isEmpty()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        }
        return DefaultCredentialsProvider.create();
    }

    private String uploadToS3(MultipartFile file, String key, String contentType) throws IOException {
        try (S3Client s3Client = S3Client.builder()
                .region(Region.of(region != null && !region.isBlank() ? region : "us-east-1"))
                .credentialsProvider(resolveCredentialsProvider())
                .build()) {

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Successfully uploaded chat document to S3: {}/{}", bucketName, key);

            // Generate a 7-day presigned GET URL so direct browser downloads never hit AccessDenied
            return generatePresignedUrl(key);
        }
    }

    public String generatePresignedUrl(String key) {
        try (S3Presigner presigner = S3Presigner.builder()
                .region(Region.of(region != null && !region.isBlank() ? region : "us-east-1"))
                .credentialsProvider(resolveCredentialsProvider())
                .build()) {

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofDays(7))
                    .getObjectRequest(getObjectRequest)
                    .build();

            return presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.warn("Failed to generate presigned S3 URL for key {}: {}", key, e.getMessage());
            return "/api/chat/attachments/view?key=" + key;
        }
    }

    public DownloadedFile fetchAttachment(String fileUrlOrKey) {
        if (fileUrlOrKey == null || fileUrlOrKey.isBlank()) {
            return null;
        }

        String key = extractS3Key(fileUrlOrKey);
        if (key != null && isS3Configured()) {
            try (S3Client s3Client = S3Client.builder()
                    .region(Region.of(region != null && !region.isBlank() ? region : "us-east-1"))
                    .credentialsProvider(resolveCredentialsProvider())
                    .build()) {

                GetObjectRequest getReq = GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();

                ResponseBytes<GetObjectResponse> responseBytes = s3Client.getObjectAsBytes(getReq);
                String contentType = responseBytes.response().contentType();
                if (contentType == null || contentType.isBlank()) {
                    contentType = detectContentType(key);
                }
                String filename = key.substring(key.lastIndexOf('/') + 1);
                if (filename.contains("_")) {
                    filename = filename.substring(filename.indexOf('_') + 1);
                }
                return new DownloadedFile(responseBytes.asByteArray(), contentType, filename);
            } catch (Exception e) {
                log.warn("S3 download failed for key {}, falling back to local files: {}", key, e.getMessage());
            }
        }

        // Local storage lookup
        return fetchLocalAttachment(fileUrlOrKey);
    }

    private String extractS3Key(String urlOrKey) {
        if (urlOrKey == null) return null;
        String clean = urlOrKey.split("\\?")[0];
        if (clean.contains(".amazonaws.com/")) {
            return clean.substring(clean.indexOf(".amazonaws.com/") + 15);
        }
        if (clean.startsWith("/")) {
            clean = clean.substring(1);
        }
        if (clean.startsWith("api/chat/files/")) {
            clean = clean.substring("api/chat/files/".length());
        }
        if (clean.startsWith("chat/")) {
            return clean;
        }
        return clean;
    }

    private DownloadedFile fetchLocalAttachment(String fileUrlOrKey) {
        try {
            String pathStr = fileUrlOrKey.split("\\?")[0];
            if (pathStr.contains("/files/")) {
                pathStr = pathStr.substring(pathStr.indexOf("/files/") + 7);
            }
            Path filePath = Paths.get(localStorageDir, pathStr).normalize();
            if (!Files.exists(filePath)) {
                filePath = Paths.get("/tmp/uploads", pathStr).normalize();
            }
            if (Files.exists(filePath) && Files.isReadable(filePath)) {
                byte[] data = Files.readAllBytes(filePath);
                String contentType = detectContentType(filePath.getFileName().toString());
                String filename = filePath.getFileName().toString();
                if (filename.contains("_")) {
                    filename = filename.substring(filename.indexOf('_') + 1);
                }
                return new DownloadedFile(data, contentType, filename);
            }
        } catch (Exception e) {
            log.error("Failed to read local file attachment: {}", e.getMessage());
        }
        return null;
    }

    private String detectContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    private String uploadToLocalStorage(MultipartFile file, String subfolder, String fileName) {
        try {
            Path targetDir = Paths.get(localStorageDir, subfolder);
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            Path targetFile = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved chat document to local storage: {}", targetFile.toAbsolutePath());
            return "/api/chat/files/" + subfolder + "/" + fileName;
        } catch (Exception e) {
            log.warn("Failed to store file in {}, falling back to /tmp/uploads: {}", localStorageDir, e.getMessage());
            try {
                Path fallbackDir = Paths.get("/tmp/uploads", subfolder);
                if (!Files.exists(fallbackDir)) {
                    Files.createDirectories(fallbackDir);
                }
                Path fallbackFile = fallbackDir.resolve(fileName);
                Files.copy(file.getInputStream(), fallbackFile, StandardCopyOption.REPLACE_EXISTING);
                log.info("Saved chat document to fallback storage: {}", fallbackFile.toAbsolutePath());
                return "/api/chat/files/" + subfolder + "/" + fileName;
            } catch (IOException ex) {
                log.error("Failed to store file in fallback storage", ex);
                throw new RuntimeException("Failed to store chat document: " + ex.getMessage(), ex);
            }
        }
    }

    public record StoredAttachment(String url, String fileName, String contentType, long size) {}
}
