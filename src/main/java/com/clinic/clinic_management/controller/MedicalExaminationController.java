package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.MedicalExaminationDtos.*;
import com.clinic.clinic_management.entity.ClinicalService;
import com.clinic.clinic_management.entity.ServiceCategory;
import com.clinic.clinic_management.service.MedicalExaminationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-examination")
public class MedicalExaminationController {

    private final MedicalExaminationService medicalExaminationService;

    public MedicalExaminationController(MedicalExaminationService medicalExaminationService) {
        this.medicalExaminationService = medicalExaminationService;
    }

    // =========================================================================
    // UC-KB01: GHI NHẬN SINH HIỆU (ĐIỀU DƯỠNG)
    // =========================================================================
    @PostMapping("/vital-signs")
    public ResponseEntity<VitalSignResponse> recordVitalSigns(@RequestBody VitalSignRequest req) {
        VitalSignResponse response = medicalExaminationService.recordVitalSigns(req);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vital-signs/patient/{patientId}")
    public ResponseEntity<VitalSignResponse> getLatestVitalSigns(@PathVariable Long patientId) {
        return medicalExaminationService.getLatestVitalSigns(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/vital-signs/history/{patientId}")
    public ResponseEntity<List<VitalSignResponse>> getVitalSignsHistory(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalExaminationService.getVitalSignsHistory(patientId));
    }

    // =========================================================================
    // UC-KB02: XEM BỆNH ÁN & LỊCH SỬ KHÁM CỦA BỆNH NHÂN (BÁC SĨ)
    // =========================================================================
    @GetMapping("/history/patient/{patientId}")
    public ResponseEntity<List<MedicalRecordSummaryDto>> getPatientMedicalHistory(@PathVariable Long patientId) {
        List<MedicalRecordSummaryDto> history = medicalExaminationService.getPatientMedicalHistory(patientId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/records/{recordId}")
    public ResponseEntity<MedicalRecordSummaryDto> getMedicalRecordById(@PathVariable Long recordId) {
        MedicalRecordSummaryDto record = medicalExaminationService.getMedicalRecordById(recordId);
        return ResponseEntity.ok(record);
    }

    // =========================================================================
    // UC-KB03: GHI TRIỆU CHỨNG & CHẨN ĐOÁN (BÁC SĨ)
    // =========================================================================
    @PostMapping("/diagnosis")
    public ResponseEntity<MedicalRecordSummaryDto> saveDiagnosis(@RequestBody SaveDiagnosisRequest req) {
        MedicalRecordSummaryDto record = medicalExaminationService.saveDiagnosis(req);
        return ResponseEntity.ok(record);
    }

    // =========================================================================
    // UC-KB04: CHỈ ĐỊNH DỊCH VỤ CẬN LÂM SÀNG (BÁC SĨ)
    // =========================================================================
    @GetMapping("/services")
    public ResponseEntity<List<ClinicalService>> getAvailableServices() {
        return ResponseEntity.ok(medicalExaminationService.getAvailableServices());
    }

    @GetMapping("/service-categories")
    public ResponseEntity<List<ServiceCategory>> getServiceCategories() {
        return ResponseEntity.ok(medicalExaminationService.getServiceCategories());
    }

    @PostMapping("/lab-orders")
    public ResponseEntity<LabOrderSummaryDto> orderClinicalServices(@RequestBody OrderLabServicesRequest req) {
        LabOrderSummaryDto order = medicalExaminationService.orderClinicalServices(req);
        return ResponseEntity.ok(order);
    }

    // =========================================================================
    // UC-KB05: XEM KẾT QUẢ CẬN LÂM SÀNG (BÁC SĨ & KỸ THUẬT VIÊN)
    // =========================================================================
    @GetMapping("/lab-orders")
    public ResponseEntity<List<LabOrderSummaryDto>> getAllLabOrders() {
        List<LabOrderSummaryDto> orders = medicalExaminationService.getAllLabOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/lab-orders/record/{recordId}")
    public ResponseEntity<List<LabOrderSummaryDto>> getLabOrdersByRecord(@PathVariable Long recordId) {
        List<LabOrderSummaryDto> orders = medicalExaminationService.getLabOrdersByRecord(recordId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/lab-orders/patient/{patientId}")
    public ResponseEntity<List<LabOrderSummaryDto>> getLabOrdersByPatient(@PathVariable Long patientId) {
        List<LabOrderSummaryDto> orders = medicalExaminationService.getLabOrdersByPatient(patientId);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/lab-results")
    public ResponseEntity<LabResultItemDto> updateLabResult(@RequestBody UpdateLabResultRequest req) {
        LabResultItemDto result = medicalExaminationService.updateLabResult(req);
        return ResponseEntity.ok(result);
    }

    // =========================================================================
    // UC-KB06: HẸN TÁI KHÁM (BÁC SĨ)
    // =========================================================================
    @PostMapping("/follow-up")
    public ResponseEntity<MedicalRecordSummaryDto> scheduleFollowUp(@RequestBody ScheduleFollowUpRequest req) {
        MedicalRecordSummaryDto record = medicalExaminationService.scheduleFollowUp(req);
        return ResponseEntity.ok(record);
    }

    // =========================================================================
    // UC-KB07: KẾT THÚC PHIÊN KHÁM (BÁC SĨ)
    // =========================================================================
    @PostMapping("/complete")
    public ResponseEntity<MedicalRecordSummaryDto> completeEncounter(@RequestBody CompleteEncounterRequest req) {
        MedicalRecordSummaryDto record = medicalExaminationService.completeEncounter(req);
        return ResponseEntity.ok(record);
    }

    // =========================================================================
    // UC-KB08: IN PHIẾU KHÁM / TÓM TẮT BỆNH ÁN (BÁC SĨ, LỄ TÂN)
    // =========================================================================
    @GetMapping("/print-summary/{recordId}")
    public ResponseEntity<MedicalSummaryPrintDto> getEncounterSummaryPrint(@PathVariable Long recordId) {
        MedicalSummaryPrintDto summary = medicalExaminationService.getEncounterSummaryPrint(recordId);
        return ResponseEntity.ok(summary);
    }
}
