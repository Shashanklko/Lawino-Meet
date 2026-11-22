package com.lawinomeet.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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
            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
        }
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
        } catch (IOException e) {
            log.error("Failed to store file locally", e);
            throw new RuntimeException("Failed to store chat document: " + e.getMessage(), e);
        }
    }

    public record StoredAttachment(String url, String fileName, String contentType, long size) {}
}
