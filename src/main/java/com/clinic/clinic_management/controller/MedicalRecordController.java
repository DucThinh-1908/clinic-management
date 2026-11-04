package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.MedicalExaminationDtos.MedicalRecordSummaryDto;
import com.clinic.clinic_management.entity.Patient;
import com.clinic.clinic_management.repository.PatientRepository;
import com.clinic.clinic_management.service.MedicalExaminationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    private final MedicalExaminationService medicalExaminationService;
    private final PatientRepository patientRepository;

    @Autowired
    public MedicalRecordController(MedicalExaminationService medicalExaminationService,
                                   PatientRepository patientRepository) {
        this.medicalExaminationService = medicalExaminationService;
        this.patientRepository = patientRepository;
    }

    /**
     * Lấy danh sách bệnh án toàn phòng khám (cho Bác sĩ, Điều dưỡng, Quản trị viên)
     */
    @GetMapping
    public ResponseEntity<List<MedicalRecordSummaryDto>> getAllMedicalRecords(
            @RequestParam(required = false) String query) {
        List<MedicalRecordSummaryDto> list = medicalExaminationService.getAllMedicalRecords(query);
        return ResponseEntity.ok(list);
    }

    /**
     * Lấy danh sách bệnh án theo bệnh nhân hoặc tài khoản người dùng bệnh nhân
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecordSummaryDto>> getMedicalRecordsByPatient(
            @PathVariable Long patientId) {
        Long effectivePatientId = patientId;
        // Nếu client truyền vào userId của bệnh nhân
        Optional<Patient> pOpt = patientRepository.findByUserId(patientId);
        if (pOpt.isPresent()) {
            effectivePatientId = pOpt.get().getId();
        }
        List<MedicalRecordSummaryDto> list = medicalExaminationService.getPatientMedicalHistory(effectivePatientId);
        return ResponseEntity.ok(list);
    }

    /**
     * Lấy chi tiết bệnh án theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMedicalRecordDetail(@PathVariable Long id) {
        try {
            MedicalRecordSummaryDto record = medicalExaminationService.getMedicalRecordById(id);
            return ResponseEntity.ok(record);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
