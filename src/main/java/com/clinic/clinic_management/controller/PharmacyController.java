package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.PharmacyDtos.*;
import com.clinic.clinic_management.entity.MedicineCategory;
import com.clinic.clinic_management.service.PharmacyService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
@CrossOrigin(origins = "*")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    // =========================================================================
    // UC-DT01: KÊ ĐƠN THUỐC (BÁC SĨ)
    // =========================================================================
    @PostMapping("/prescriptions")
    public ResponseEntity<PrescriptionResponse> createPrescription(@RequestBody CreatePrescriptionRequest req) {
        PrescriptionResponse resp = pharmacyService.createPrescription(req);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<List<PrescriptionResponse>> getAllPrescriptions(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(pharmacyService.getAllPrescriptions(status));
    }

    @GetMapping("/prescriptions/{id}")
    public ResponseEntity<PrescriptionResponse> getPrescriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(pharmacyService.getPrescriptionById(id));
    }

    @GetMapping("/prescriptions/patient/{patientId}")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptionsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(pharmacyService.getPrescriptionsByPatient(patientId));
    }

    // =========================================================================
    // UC-DT02: CẢNH BÁO DỊ ỨNG KHI KÊ ĐƠN (HỆ THỐNG)
    // =========================================================================
    @PostMapping("/check-allergies")
    public ResponseEntity<AllergyAlertResponse> checkAllergies(@RequestBody AllergyCheckRequest req) {
        return ResponseEntity.ok(pharmacyService.checkAllergies(req));
    }

    // =========================================================================
    // UC-DT03: IN ĐƠN THUỐC (BÁC SĨ, DƯỢC SĨ)
    // =========================================================================
    @GetMapping("/prescriptions/{id}/print")
    public ResponseEntity<PrescriptionPrintDto> getPrescriptionPrintData(@PathVariable Long id) {
        return ResponseEntity.ok(pharmacyService.getPrescriptionPrintData(id));
    }

    // =========================================================================
    // UC-DT04: CẤP PHÁT THUỐC THEO ĐƠN (DƯỢC SĨ)
    // =========================================================================
    @PostMapping("/dispensations")
    public ResponseEntity<DispensationResponse> dispensePrescription(@RequestBody DispensePrescriptionRequest req) {
        return ResponseEntity.ok(pharmacyService.dispensePrescription(req));
    }

    // =========================================================================
    // UC-DT05: QUẢN LÝ DANH MỤC THUỐC (DƯỢC SĨ)
    // =========================================================================
    @GetMapping("/medicines")
    public ResponseEntity<List<MedicineDetailDto>> getAllMedicines(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId
    ) {
        return ResponseEntity.ok(pharmacyService.getAllMedicines(query, categoryId));
    }

    @GetMapping("/medicines/{id}")
    public ResponseEntity<MedicineDetailDto> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(pharmacyService.getMedicineById(id));
    }

    @PostMapping("/medicines")
    public ResponseEntity<MedicineDetailDto> saveMedicine(@RequestBody SaveMedicineRequest req) {
        return ResponseEntity.ok(pharmacyService.saveMedicine(req));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<MedicineCategory>> getAllCategories() {
        return ResponseEntity.ok(pharmacyService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<MedicineCategory> saveCategory(@RequestBody MedicineCategory cat) {
        return ResponseEntity.ok(pharmacyService.saveCategory(cat));
    }

    // =========================================================================
    // UC-DT06: NHẬP KHO THUỐC (DƯỢC SĨ)
    // =========================================================================
    @PostMapping("/batches/import")
    public ResponseEntity<BatchDetailDto> importStock(@RequestBody ImportStockRequest req) {
        return ResponseEntity.ok(pharmacyService.importStock(req));
    }

    // =========================================================================
    // UC-DT07: KIỂM KÊ TỒN KHO THUỐC (DƯỢC SĨ)
    // =========================================================================
    @GetMapping("/batches")
    public ResponseEntity<List<BatchDetailDto>> getAllBatches(@RequestParam(required = false) Long medicineId) {
        return ResponseEntity.ok(pharmacyService.getAllBatches(medicineId));
    }

    @PostMapping("/batches/audit")
    public ResponseEntity<BatchDetailDto> auditStock(@RequestBody StockAuditRequest req) {
        return ResponseEntity.ok(pharmacyService.auditStock(req));
    }

    // =========================================================================
    // UC-DT08: CẢNH BÁO THUỐC SẮP HẾT / SẮP HẾT HẠN (HỆ THỐNG, DƯỢC SĨ)
    // =========================================================================
    @GetMapping("/alerts")
    public ResponseEntity<StockAlertOverviewDto> getStockAlerts(
            @RequestParam(required = false) Integer lowStockThreshold,
            @RequestParam(required = false) Integer nearExpiryDays
    ) {
        return ResponseEntity.ok(pharmacyService.getStockAlerts(lowStockThreshold, nearExpiryDays));
    }

    // =========================================================================
    // UC-DT09: QUẢN LÝ NHÀ CUNG CẤP (DƯỢC SĨ)
    // =========================================================================
    @GetMapping("/suppliers")
    public ResponseEntity<List<SupplierDetailDto>> getAllSuppliers() {
        return ResponseEntity.ok(pharmacyService.getAllSuppliers());
    }

    @PostMapping("/suppliers")
    public ResponseEntity<SupplierDetailDto> saveSupplier(@RequestBody SaveSupplierRequest req) {
        return ResponseEntity.ok(pharmacyService.saveSupplier(req));
    }

    // =========================================================================
    // UC-DT10: LỊCH SỬ NHẬP – XUẤT THUỐC (DƯỢC SĨ, QUẢN LÝ)
    // =========================================================================
    @GetMapping("/transactions")
    public ResponseEntity<List<StockTransactionDto>> getStockTransactions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(pharmacyService.getStockTransactions(type, fromDate, toDate));
    }
}
