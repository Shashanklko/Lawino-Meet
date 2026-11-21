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
                            .balance(BigDecimal.ZERO)
                            .escrowBalance(BigDecimal.ZERO)
                            .currency("INR")
                            .build();
                    Wallet saved = walletRepository.save(newWallet);
                    log.info("Initialized wallet for user {} ({}) with opening balance ₹0.00",
                            username, userPublicId);
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

        // 1. Client Wallet Deduction
        Wallet clientWallet = walletRepository.findByUserPublicIdForUpdate(request.getClientUserPublicId())
                .orElseGet(() -> getOrCreateWalletEntity(request.getClientUserPublicId(), "client", "CLIENT"));

        if (clientWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new ApiException(
                    String.format("Insufficient wallet balance (Current: ₹%s, Required: ₹%s). Please add funds to proceed.",
                            clientWallet.getBalance().toPlainString(), request.getAmount().toPlainString()),
                    HttpStatus.BAD_REQUEST, "INSUFFICIENT_WALLET_BALANCE");
        }

        BigDecimal newClientBalance = clientWallet.getBalance().subtract(request.getAmount());
        clientWallet.setBalance(newClientBalance);
        BigDecimal currentClientEscrow = clientWallet.getEscrowBalance() != null ? clientWallet.getEscrowBalance() : BigDecimal.ZERO;
        clientWallet.setEscrowBalance(currentClientEscrow.add(request.getAmount()));
        Wallet savedClientWallet = walletRepository.save(clientWallet);

        WalletTransaction clientTx = WalletTransaction.builder()
                .publicId(UUID.randomUUID().toString())
                .wallet(savedClientWallet)
                .userPublicId(request.getClientUserPublicId())
                .amount(request.getAmount().negate())
                .type(TransactionType.PAYMENT_DEDUCTION)
                .status(TransactionStatus.SUCCESS)
                .referenceId(request.getAppointmentPublicId())
                .description(request.getDescription() != null ? request.getDescription() : "Retainer payment for consultation")
                .paymentMethod("WALLET")
                .balanceAfter(newClientBalance)
                .build();
        WalletTransaction savedClientTx = transactionRepository.save(clientTx);

        // 2. Lawyer Wallet: Credit Consultation Fee into Non-Withdrawable Escrow
        if (request.getLawyerUserPublicId() != null && !request.getLawyerUserPublicId().isBlank()) {
            Wallet lawyerWallet = walletRepository.findByUserPublicIdForUpdate(request.getLawyerUserPublicId())
                    .orElseGet(() -> getOrCreateWalletEntity(request.getLawyerUserPublicId(), "lawyer", "LAWYER"));

            BigDecimal currentLawyerEscrow = lawyerWallet.getEscrowBalance() != null ? lawyerWallet.getEscrowBalance() : BigDecimal.ZERO;
            BigDecimal newLawyerEscrow = currentLawyerEscrow.add(request.getAmount());
            lawyerWallet.setEscrowBalance(newLawyerEscrow);
            Wallet savedLawyerWallet = walletRepository.save(lawyerWallet);

            WalletTransaction lawyerTx = WalletTransaction.builder()
                    .publicId(UUID.randomUUID().toString())
                    .wallet(savedLawyerWallet)
                    .userPublicId(request.getLawyerUserPublicId())
                    .amount(request.getAmount())
                    .type(TransactionType.ESCROW_HOLD)
                    .status(TransactionStatus.SUCCESS)
                    .referenceId(request.getAppointmentPublicId())
                    .description("Consultation fee held in non-withdrawable escrow #" + request.getAppointmentPublicId().substring(0, Math.min(8, request.getAppointmentPublicId().length())))
                    .paymentMethod("ESCROW_HOLD")
                    .balanceAfter(savedLawyerWallet.getBalance())
                    .build();
            transactionRepository.save(lawyerTx);

            log.info("Credited ₹{} to non-withdrawable escrow for lawyer {}. Total escrow: ₹{}",
                    request.getAmount(), request.getLawyerUserPublicId(), newLawyerEscrow);
        }

        log.info("Deducted ₹{} from client {} for appointment {}. New balance: ₹{}",
                request.getAmount(), request.getClientUserPublicId(), request.getAppointmentPublicId(), newClientBalance);

        return WalletTransactionResponse.fromEntity(savedClientTx);
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

        // 1. Lawyer Wallet Settlement: Move from Escrow to Withdrawable Balance
        Wallet lawyerWallet = walletRepository.findByUserPublicIdForUpdate(request.getLawyerUserPublicId())
                .orElseGet(() -> getOrCreateWalletEntity(request.getLawyerUserPublicId(), "lawyer", "LAWYER"));

        BigDecimal currentLawyerEscrow = lawyerWallet.getEscrowBalance() != null ? lawyerWallet.getEscrowBalance() : BigDecimal.ZERO;
        BigDecimal newLawyerEscrow = currentLawyerEscrow.subtract(request.getAmount());
        if (newLawyerEscrow.compareTo(BigDecimal.ZERO) < 0) {
            newLawyerEscrow = BigDecimal.ZERO;
        }
        lawyerWallet.setEscrowBalance(newLawyerEscrow);

        BigDecimal newLawyerBalance = lawyerWallet.getBalance().add(request.getAmount());
        lawyerWallet.setBalance(newLawyerBalance);
        Wallet savedLawyerWallet = walletRepository.save(lawyerWallet);

        WalletTransaction lawyerTx = WalletTransaction.builder()
                .publicId(UUID.randomUUID().toString())
                .wallet(savedLawyerWallet)
                .userPublicId(request.getLawyerUserPublicId())
                .amount(request.getAmount())
                .type(TransactionType.ESCROW_RELEASE)
                .status(TransactionStatus.SUCCESS)
                .referenceId(request.getAppointmentPublicId())
                .description(request.getDescription() != null ? request.getDescription() : "Settlement fee released for completed consultation")
                .paymentMethod("ESCROW_SETTLEMENT")
                .balanceAfter(newLawyerBalance)
                .build();
        WalletTransaction savedLawyerTx = transactionRepository.save(lawyerTx);

        // 2. Client Wallet: Clear corresponding Escrow hold
        if (request.getClientUserPublicId() != null && !request.getClientUserPublicId().isBlank()) {
            walletRepository.findByUserPublicIdForUpdate(request.getClientUserPublicId()).ifPresent(clientWallet -> {
                BigDecimal currentClientEscrow = clientWallet.getEscrowBalance() != null ? clientWallet.getEscrowBalance() : BigDecimal.ZERO;
                BigDecimal newClientEscrow = currentClientEscrow.subtract(request.getAmount());
                if (newClientEscrow.compareTo(BigDecimal.ZERO) < 0) {
                    newClientEscrow = BigDecimal.ZERO;
                }
                clientWallet.setEscrowBalance(newClientEscrow);
                walletRepository.save(clientWallet);
            });
        }

        log.info("Settled ₹{} to lawyer {} for appointment {}. New balance: ₹{}, Remaining escrow: ₹{}",
                request.getAmount(), request.getLawyerUserPublicId(), request.getAppointmentPublicId(), newLawyerBalance, newLawyerEscrow);

        return WalletTransactionResponse.fromEntity(savedLawyerTx);
    }

    @Transactional
    public WalletTransactionResponse refundForAppointment(RefundFundsRequest request) {
        // Idempotency: Check if already refunded
        List<WalletTransaction> existing = transactionRepository.findByReferenceId(request.getAppointmentPublicId());
        for (WalletTransaction tx : existing) {
            if (tx.getType() == TransactionType.REFUND && tx.getStatus() == TransactionStatus.SUCCESS) {
                log.info("Refund already processed for appointment {}. Returning existing transaction {}.",
                        request.getAppointmentPublicId(), tx.getPublicId());
                return WalletTransactionResponse.fromEntity(tx);
            }
        }

        // 1. Client Wallet: Restore balance, release escrow
        Wallet clientWallet = walletRepository.findByUserPublicIdForUpdate(request.getClientUserPublicId())
                .orElseGet(() -> getOrCreateWalletEntity(request.getClientUserPublicId(), "client", "CLIENT"));

        BigDecimal currentClientEscrow = clientWallet.getEscrowBalance() != null ? clientWallet.getEscrowBalance() : BigDecimal.ZERO;
        BigDecimal newClientEscrow = currentClientEscrow.subtract(request.getAmount());
        if (newClientEscrow.compareTo(BigDecimal.ZERO) < 0) {
            newClientEscrow = BigDecimal.ZERO;
        }
        clientWallet.setEscrowBalance(newClientEscrow);

        BigDecimal newClientBalance = clientWallet.getBalance().add(request.getAmount());
        clientWallet.setBalance(newClientBalance);
        Wallet savedClientWallet = walletRepository.save(clientWallet);

        WalletTransaction refundTx = WalletTransaction.builder()
                .publicId(UUID.randomUUID().toString())
                .wallet(savedClientWallet)
                .userPublicId(request.getClientUserPublicId())
                .amount(request.getAmount())
                .type(TransactionType.REFUND)
                .status(TransactionStatus.SUCCESS)
                .referenceId(request.getAppointmentPublicId())
                .description(request.getDescription() != null ? request.getDescription() : "Refund for cancelled consultation #" + request.getAppointmentPublicId().substring(0, Math.min(8, request.getAppointmentPublicId().length())))
                .paymentMethod("WALLET_REFUND")
                .balanceAfter(newClientBalance)
                .build();
        WalletTransaction savedRefundTx = transactionRepository.save(refundTx);

        // 2. Lawyer Wallet: Remove escrow hold if still pending
        if (request.getLawyerUserPublicId() != null && !request.getLawyerUserPublicId().isBlank()) {
            walletRepository.findByUserPublicIdForUpdate(request.getLawyerUserPublicId()).ifPresent(lawyerWallet -> {
                BigDecimal currentLawyerEscrow = lawyerWallet.getEscrowBalance() != null ? lawyerWallet.getEscrowBalance() : BigDecimal.ZERO;
                BigDecimal newLawyerEscrow = currentLawyerEscrow.subtract(request.getAmount());
                if (newLawyerEscrow.compareTo(BigDecimal.ZERO) < 0) {
                    newLawyerEscrow = BigDecimal.ZERO;
                }
                lawyerWallet.setEscrowBalance(newLawyerEscrow);
                walletRepository.save(lawyerWallet);
            });
        }

        log.info("Refunded ₹{} to client {} for cancelled appointment {}. New balance: ₹{}",
                request.getAmount(), request.getClientUserPublicId(), request.getAppointmentPublicId(), newClientBalance);

        return WalletTransactionResponse.fromEntity(savedRefundTx);
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
