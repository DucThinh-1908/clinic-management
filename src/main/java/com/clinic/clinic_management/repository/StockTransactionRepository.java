package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    List<StockTransaction> findByBatchIdOrderByTransactionDateDesc(Long batchId);

    List<StockTransaction> findByTransactionTypeOrderByTransactionDateDesc(String transactionType);

    List<StockTransaction> findByTransactionDateBetweenOrderByTransactionDateDesc(LocalDateTime start, LocalDateTime end);

    List<StockTransaction> findAllByOrderByTransactionDateDesc();
}
