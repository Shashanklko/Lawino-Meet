package com.lawinomeet.user.service;

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

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class StorageService {

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

    public String storeProfilePhoto(MultipartFile file, String userPublicId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        } else {
            extension = ".jpg";
        }

        String uniqueFileName = "avatar_" + UUID.randomUUID().toString().substring(0, 8) + extension;
        String s3Key = "profiles/" + userPublicId + "/" + uniqueFileName;

        // Try S3 first (supporting both explicit credentials and EC2 IAM role / default credential provider chain)
        if (isS3Configured()) {
            try {
                return uploadToS3(file, s3Key);
            } catch (Exception e) {
                log.warn("S3 upload failed, falling back to local storage: {}", e.getMessage());
            }
        }

        // Local storage fallback
        return uploadToLocalStorage(file, "profiles/" + userPublicId, uniqueFileName);
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

    private String uploadToS3(MultipartFile file, String key) throws IOException {
        try (S3Client s3Client = S3Client.builder()
                .region(Region.of(region != null && !region.isBlank() ? region : "us-east-1"))
                .credentialsProvider(resolveCredentialsProvider())
                .build()) {

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Successfully uploaded profile image to S3: {}/{}", bucketName, key);
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
            log.info("Saved profile image to local storage: {}", targetFile.toAbsolutePath());
            return "/api/users/files/" + subfolder + "/" + fileName;
        } catch (Exception e) {
            log.warn("Failed to store file in {}, falling back to /tmp/uploads: {}", localStorageDir, e.getMessage());
            try {
                Path fallbackDir = Paths.get("/tmp/uploads", subfolder);
                if (!Files.exists(fallbackDir)) {
                    Files.createDirectories(fallbackDir);
                }
                Path fallbackFile = fallbackDir.resolve(fileName);
                Files.copy(file.getInputStream(), fallbackFile, StandardCopyOption.REPLACE_EXISTING);
                log.info("Saved profile image to fallback storage: {}", fallbackFile.toAbsolutePath());
                return "/api/users/files/" + subfolder + "/" + fileName;
            } catch (IOException ex) {
                log.error("Failed to store file in fallback storage", ex);
                throw new RuntimeException("Failed to store file: " + ex.getMessage(), ex);
            }
        }
    }
}
