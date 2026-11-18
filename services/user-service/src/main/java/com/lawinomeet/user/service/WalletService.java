package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.*;
import com.lawinomeet.user.entity.*;
import com.lawinomeet.user.exception.ApiException;
import com.lawinomeet.user.repository.WalletRepository;
import com.lawinomeet.user.repository.WalletTransactionRepository;
import com.lawinomeet.user.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    @Transactional
    public Wallet getOrCreateWalletEntity(String userPublicId, String username, String role) {
        return walletRepository.findByUserPublicId(userPublicId)
                .orElseGet(() -> {
                    Wallet newWallet = Wallet.builder()
                            .publicId(UUID.randomUUID().toString())
                            .userPublicId(userPublicId)
                            .username(username != null ? username : "user")
                            .userRole(role != null ? role : "CLIENT")
                            .balance(new BigDecimal("5000.00")) // Give default promotional opening balance of ₹5,000 for seamless testing
                            .escrowBalance(BigDecimal.ZERO)
                            .currency("INR")
                            .build();
                    Wallet saved = walletRepository.save(newWallet);
                    log.info("Initialized default wallet for user {} ({}) with initial promotional balance ₹5,000",
                            username, userPublicId);

                    // Record initial deposit transaction
                    WalletTransaction initialTx = WalletTransaction.builder()
                            .publicId(UUID.randomUUID().toString())
                            .wallet(saved)
                            .userPublicId(userPublicId)
                            .amount(new BigDecimal("5000.00"))
                            .type(TransactionType.DEPOSIT)
                            .status(TransactionStatus.SUCCESS)
                            .referenceId("PROMO-INIT-" + UUID.randomUUID().toString().substring(0, 8))
                            .description("Opening promotional balance credit")
                            .paymentMethod("SYSTEM_PROMO")
                            .balanceAfter(new BigDecimal("5000.00"))
                            .build();
                    transactionRepository.save(initialTx);

                    return saved;
                });
    }

    @Transactional
    public WalletResponse getMyWallet(UserPrincipal principal) {
        Wallet wallet = getOrCreateWalletEntity(principal.getPublicId(), principal.getUsername(), principal.getRole());
        List<WalletTransaction> transactions = transactionRepository.findByUserPublicIdOrderByCreatedAtDesc(principal.getPublicId());
        List<WalletTransactionResponse> txDtos = transactions.stream()
                .map(WalletTransactionResponse::fromEntity)
                .toList();
        return WalletResponse.fromEntity(wallet, txDtos);
    }

    @Transactional
    public WalletResponse addFunds(UserPrincipal principal, AddFundsRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Deposit amount must be greater than zero.", HttpStatus.BAD_REQUEST, "INVALID_AMOUNT");
        }

        Wallet wallet = walletRepository.findByUserPublicIdForUpdate(principal.getPublicId())
                .orElseGet(() -> getOrCreateWalletEntity(principal.getPublicId(), principal.getUsername(), principal.getRole()));

        BigDecimal newBalance = wallet.getBalance().add(request.getAmount());
        wallet.setBalance(newBalance);
        Wallet saved = walletRepository.save(wallet);

        String ref = request.getTransactionReference() != null && !request.getTransactionReference().isBlank()
                ? request.getTransactionReference()
                : "DEP-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        WalletTransaction tx = WalletTransaction.builder()
                .publicId(UUID.randomUUID().toString())
                .wallet(saved)
                .userPublicId(principal.getPublicId())
                .amount(request.getAmount())
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .referenceId(ref)
                .description("Wallet top-up via " + (request.getPaymentMethod() != null ? request.getPaymentMethod() : "Razorpay / UPI"))
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "RAZORPAY")
                .balanceAfter(newBalance)
                .build();
        transactionRepository.save(tx);

        log.info("User {} added ₹{} to wallet. New balance: ₹{}", principal.getUsername(), request.getAmount(), newBalance);

        List<WalletTransaction> transactions = transactionRepository.findByUserPublicIdOrderByCreatedAtDesc(principal.getPublicId());
        return WalletResponse.fromEntity(saved, transactions.stream().map(WalletTransactionResponse::fromEntity).toList());
    }

    @Transactional
    public WalletTransactionResponse deductForAppointment(DeductFundsRequest request) {
        // Idempotency: Check if already deducted for this appointment
        List<WalletTransaction> existing = transactionRepository.findByReferenceId(request.getAppointmentPublicId());
        for (WalletTransaction tx : existing) {
            if (tx.getType() == TransactionType.PAYMENT_DEDUCTION && tx.getStatus() == TransactionStatus.SUCCESS) {
                log.info("Payment already deducted for appointment {}. Returning existing transaction {}.",
                        request.getAppointmentPublicId(), tx.getPublicId());
                return WalletTransactionResponse.fromEntity(tx);
            }
        }

        Wallet wallet = walletRepository.findByUserPublicIdForUpdate(request.getClientUserPublicId())
                .orElseGet(() -> getOrCreateWalletEntity(request.getClientUserPublicId(), "client", "CLIENT"));

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new ApiException(
                    String.format("Insufficient wallet balance (Current: ₹%s, Required: ₹%s). Please add funds to proceed.",
                            wallet.getBalance().toPlainString(), request.getAmount().toPlainString()),
                    HttpStatus.BAD_REQUEST, "INSUFFICIENT_WALLET_BALANCE");
        }

        BigDecimal newBalance = wallet.getBalance().subtract(request.getAmount());
        wallet.setBalance(newBalance);
        Wallet savedWallet = walletRepository.save(wallet);

        WalletTransaction tx = WalletTransaction.builder()
                .publicId(UUID.randomUUID().toString())
                .wallet(savedWallet)
                .userPublicId(request.getClientUserPublicId())
                .amount(request.getAmount().negate())
                .type(TransactionType.PAYMENT_DEDUCTION)
                .status(TransactionStatus.SUCCESS)
                .referenceId(request.getAppointmentPublicId())
                .description(request.getDescription() != null ? request.getDescription() : "Retainer payment for consultation")
                .paymentMethod("WALLET")
                .balanceAfter(newBalance)
                .build();

        WalletTransaction savedTx = transactionRepository.save(tx);
        log.info("Deducted ₹{} from client {} for appointment {}. New balance: ₹{}",
                request.getAmount(), request.getClientUserPublicId(), request.getAppointmentPublicId(), newBalance);

        return WalletTransactionResponse.fromEntity(savedTx);
    }

    @Transactional
    public WalletTransactionResponse settleToLawyer(SettleFundsRequest request) {
        // Idempotency: Check if already settled for this appointment
        List<WalletTransaction> existing = transactionRepository.findByReferenceId(request.getAppointmentPublicId());
        for (WalletTransaction tx : existing) {
            if (tx.getType() == TransactionType.ESCROW_RELEASE && tx.getStatus() == TransactionStatus.SUCCESS) {
                log.info("Settlement already completed for appointment {}. Returning existing transaction {}.",
                        request.getAppointmentPublicId(), tx.getPublicId());
                return WalletTransactionResponse.fromEntity(tx);
            }
        }

        Wallet wallet = walletRepository.findByUserPublicIdForUpdate(request.getLawyerUserPublicId())
                .orElseGet(() -> getOrCreateWalletEntity(request.getLawyerUserPublicId(), "lawyer", "LAWYER"));

        BigDecimal newBalance = wallet.getBalance().add(request.getAmount());
        wallet.setBalance(newBalance);
        Wallet savedWallet = walletRepository.save(wallet);

        WalletTransaction tx = WalletTransaction.builder()
                .publicId(UUID.randomUUID().toString())
                .wallet(savedWallet)
                .userPublicId(request.getLawyerUserPublicId())
                .amount(request.getAmount())
                .type(TransactionType.ESCROW_RELEASE)
                .status(TransactionStatus.SUCCESS)
                .referenceId(request.getAppointmentPublicId())
                .description(request.getDescription() != null ? request.getDescription() : "Settlement fee released for completed consultation")
                .paymentMethod("ESCROW_SETTLEMENT")
                .balanceAfter(newBalance)
                .build();

        WalletTransaction savedTx = transactionRepository.save(tx);
        log.info("Settled ₹{} to lawyer {} for appointment {}. New balance: ₹{}",
                request.getAmount(), request.getLawyerUserPublicId(), request.getAppointmentPublicId(), newBalance);

        return WalletTransactionResponse.fromEntity(savedTx);
    }

    @Transactional
    public WalletResponse withdraw(UserPrincipal principal, WithdrawFundsRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Withdrawal amount must be greater than zero.", HttpStatus.BAD_REQUEST, "INVALID_AMOUNT");
        }

        Wallet wallet = walletRepository.findByUserPublicIdForUpdate(principal.getPublicId())
                .orElseThrow(() -> new ApiException("Wallet not found.", HttpStatus.NOT_FOUND, "WALLET_NOT_FOUND"));

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new ApiException("Requested amount exceeds withdrawable balance.", HttpStatus.BAD_REQUEST, "INSUFFICIENT_FUNDS");
        }

        BigDecimal newBalance = wallet.getBalance().subtract(request.getAmount());
        wallet.setBalance(newBalance);
        Wallet saved = walletRepository.save(wallet);

        String methodDesc = "BANK".equalsIgnoreCase(request.getPayoutMethod())
                ? "Bank Transfer (A/C: " + (request.getAccountNumber() != null ? "••••" + request.getAccountNumber().substring(Math.max(0, request.getAccountNumber().length() - 4)) : "Verified") + ")"
                : "UPI Transfer (" + (request.getUpiId() != null ? request.getUpiId() : "Verified") + ")";

        WalletTransaction tx = WalletTransaction.builder()
                .publicId(UUID.randomUUID().toString())
                .wallet(saved)
                .userPublicId(principal.getPublicId())
                .amount(request.getAmount().negate())
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.SUCCESS)
                .referenceId("WD-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .description("Withdrawal payout to " + methodDesc)
                .paymentMethod(request.getPayoutMethod() != null ? request.getPayoutMethod() : "BANK")
                .balanceAfter(newBalance)
                .build();
        transactionRepository.save(tx);

        log.info("User {} withdrew ₹{} from wallet. Remaining: ₹{}", principal.getUsername(), request.getAmount(), newBalance);

        List<WalletTransaction> transactions = transactionRepository.findByUserPublicIdOrderByCreatedAtDesc(principal.getPublicId());
        return WalletResponse.fromEntity(saved, transactions.stream().map(WalletTransactionResponse::fromEntity).toList());
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getTransactions(UserPrincipal principal) {
        List<WalletTransaction> list = transactionRepository.findByUserPublicIdOrderByCreatedAtDesc(principal.getPublicId());
        return list.stream().map(WalletTransactionResponse::fromEntity).toList();
    }
}
