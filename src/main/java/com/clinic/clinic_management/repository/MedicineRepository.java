package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findByCode(String code);

    List<Medicine> findByIsActiveTrue();

    List<Medicine> findByCategoryIdAndIsActiveTrue(Long categoryId);

    @Query("SELECT m FROM Medicine m WHERE m.isActive = true AND " +
           "(LOWER(m.brandName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.activeIngredient) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.code) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Medicine> searchMedicines(@Param("query") String query);
}
