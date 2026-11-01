package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenAndIsUsedFalseAndExpiresAtAfter(String token, LocalDateTime now);
    Optional<PasswordResetToken> findByToken(String token);
}
