package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {

    List<MedicineBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    // Lấy các lô còn thuốc khả dụng theo thứ tự hết hạn trước xuất trước (FEFO)
    List<MedicineBatch> findByMedicineIdAndQuantityAvailableGreaterThanOrderByExpiryDateAsc(Long medicineId, Integer minQuantity);

    // Tìm các lô sắp hết hạn (expiryDate <= threshold)
    List<MedicineBatch> findByExpiryDateLessThanEqualAndQuantityAvailableGreaterThanOrderByExpiryDateAsc(LocalDate thresholdDate, Integer minQuantity);

    // Tính tổng tồn kho khả dụng của từng loại thuốc
    @Query("SELECT b.medicineId, SUM(b.quantityAvailable) FROM MedicineBatch b GROUP BY b.medicineId")
    List<Object[]> sumQuantityAvailableGroupedByMedicine();

    @Query("SELECT COALESCE(SUM(b.quantityAvailable), 0) FROM MedicineBatch b WHERE b.medicineId = :medicineId AND b.expiryDate > :currentDate")
    Integer getTotalAvailableQuantityForMedicine(@Param("medicineId") Long medicineId, @Param("currentDate") LocalDate currentDate);

    List<MedicineBatch> findBySupplierId(Long supplierId);
}
