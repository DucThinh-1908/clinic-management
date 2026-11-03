package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.MedicalExaminationDtos.*;
import com.clinic.clinic_management.entity.*;
import com.clinic.clinic_management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MedicalExaminationService {

    private final VitalSignRepository vitalSignRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final LabOrderRepository labOrderRepository;
    private final LabResultRepository labResultRepository;
    private final PatientRepository patientRepository;
    private final StaffRepository staffRepository;
    private final ClinicRoomRepository clinicRoomRepository;
    private final DepartmentRepository departmentRepository;
    private final QueueTicketRepository queueTicketRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public MedicalExaminationService(
            VitalSignRepository vitalSignRepository,
            MedicalRecordRepository medicalRecordRepository,
            ClinicalServiceRepository clinicalServiceRepository,
            ServiceCategoryRepository serviceCategoryRepository,
            LabOrderRepository labOrderRepository,
            LabResultRepository labResultRepository,
            PatientRepository patientRepository,
            StaffRepository staffRepository,
            ClinicRoomRepository clinicRoomRepository,
            DepartmentRepository departmentRepository,
            QueueTicketRepository queueTicketRepository,
            AppointmentRepository appointmentRepository,
            DoctorProfileRepository doctorProfileRepository
    ) {
        this.vitalSignRepository = vitalSignRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.clinicalServiceRepository = clinicalServiceRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.labOrderRepository = labOrderRepository;
        this.labResultRepository = labResultRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.clinicRoomRepository = clinicRoomRepository;
        this.departmentRepository = departmentRepository;
        this.queueTicketRepository = queueTicketRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    // =========================================================================
    // UC-KB01: GHI NHẬN SINH HIỆU (ĐIỀU DƯỠNG)
    // =========================================================================
    public VitalSignResponse recordVitalSigns(VitalSignRequest req) {
        if (req.getPatientId() == null) {
            throw new IllegalArgumentException("Mã bệnh nhân không được để trống");
        }
        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bệnh nhân với ID: " + req.getPatientId()));

        Long nurseId = req.getNurseId();
        if (nurseId == null) {
            // Mặc định gán điều dưỡng mẫu nếu không truyền
            nurseId = staffRepository.findByStaffCode("DD001")
                    .map(Staff::getId)
                    .orElse(4L);
        }

        VitalSign vitalSign = new VitalSign();
        vitalSign.setPatientId(patient.getId());
        vitalSign.setNurseId(nurseId);
        vitalSign.setTemperature(req.getTemperature());
        vitalSign.setBloodPressureSystolic(req.getBloodPressureSystolic());
        vitalSign.setBloodPressureDiastolic(req.getBloodPressureDiastolic());
        vitalSign.setHeartRate(req.getHeartRate());
        vitalSign.setRespiratoryRate(req.getRespiratoryRate());
        vitalSign.setSpo2(req.getSpo2());
        vitalSign.setWeightKg(req.getWeightKg());
        vitalSign.setHeightCm(req.getHeightCm());
        vitalSign.setNotes(req.getNotes());
        vitalSign.calculateBmi();
        vitalSign.setMeasuredAt(LocalDateTime.now());

        VitalSign saved = vitalSignRepository.save(vitalSign);

        // Nếu có ticketId, cập nhật ghi chú sinh hiệu vào ticket nếu cần
        if (req.getTicketId() != null) {
            queueTicketRepository.findById(req.getTicketId()).ifPresent(ticket -> {
                String note = (ticket.getNotes() != null ? ticket.getNotes() + " | " : "") +
                        "Đã đo sinh hiệu: HA " + (saved.getBloodPressureSystolic() != null ? saved.getBloodPressureSystolic() : "-") + "/" +
                        (saved.getBloodPressureDiastolic() != null ? saved.getBloodPressureDiastolic() : "-") + " mmHg, Nhiệt độ " +
                        (saved.getTemperature() != null ? saved.getTemperature() : "-") + "°C";
                ticket.setNotes(note);
                queueTicketRepository.save(ticket);
            });
        }

        return mapToVitalSignResponse(saved, patient.getFullName());
    }

    public Optional<VitalSignResponse> getLatestVitalSigns(Long patientId) {
        return vitalSignRepository.findFirstByPatientIdOrderByMeasuredAtDesc(patientId)
                .map(vs -> {
                    String patientName = patientRepository.findById(patientId).map(Patient::getFullName).orElse("");
                    return mapToVitalSignResponse(vs, patientName);
                });
    }

    @Transactional(readOnly = true)
    public List<VitalSignResponse> getVitalSignsHistory(Long patientId) {
        String patientName = patientRepository.findById(patientId).map(Patient::getFullName).orElse("");
        return vitalSignRepository.findByPatientIdOrderByMeasuredAtDesc(patientId).stream()
                .map(vs -> mapToVitalSignResponse(vs, patientName))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // UC-KB02: XEM BỆNH ÁN & LỊCH SỬ KHÁM CỦA BỆNH NHÂN (BÁC SĨ)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<MedicalRecordSummaryDto> getPatientMedicalHistory(Long patientId) {
        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        String patientName = patientRepository.findById(patientId).map(Patient::getFullName).orElse("");

        return records.stream()
                .map(rec -> mapToMedicalRecordSummary(rec, patientName))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicalRecordSummaryDto getMedicalRecordById(Long recordId) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh án với ID: " + recordId));
        String patientName = patientRepository.findById(record.getPatientId()).map(Patient::getFullName).orElse("");
        return mapToMedicalRecordSummary(record, patientName);
    }

    // =========================================================================
    // UC-KB03: GHI TRIỆU CHỨNG & CHẨN ĐOÁN (BÁC SĨ)
    // =========================================================================
    public MedicalRecordSummaryDto saveDiagnosis(SaveDiagnosisRequest req) {
        if (req.getChiefComplaint() == null || req.getChiefComplaint().trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do vào khám không được để trống");
        }

        MedicalRecord record;
        if (req.getMedicalRecordId() != null) {
            record = medicalRecordRepository.findById(req.getMedicalRecordId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh án để cập nhật"));
        } else {
            record = new MedicalRecord();
            record.setRecordCode(generateRecordCode());
            record.setPatientId(req.getPatientId());
            record.setDoctorId(req.getDoctorId() != null ? req.getDoctorId() : 2L);
            record.setRoomId(req.getRoomId() != null ? req.getRoomId() : 1L);
            record.setAppointmentId(req.getAppointmentId());

            // Tự động tìm sinh hiệu gần nhất nếu chưa gắn
            if (req.getVitalSignsId() != null) {
                record.setVitalSignsId(req.getVitalSignsId());
            } else if (req.getPatientId() != null) {
                vitalSignRepository.findFirstByPatientIdOrderByMeasuredAtDesc(req.getPatientId())
                        .ifPresent(vs -> record.setVitalSignsId(vs.getId()));
            }
        }

        record.setChiefComplaint(req.getChiefComplaint().trim());
        if (req.getHistoryOfPresentIllness() != null) {
            record.setHistoryOfPresentIllness(req.getHistoryOfPresentIllness().trim());
        }
        if (req.getPhysicalExamination() != null) {
            record.setPhysicalExamination(req.getPhysicalExamination().trim());
        }
        if (req.getInitialDiagnosis() != null) {
            record.setInitialDiagnosis(req.getInitialDiagnosis().trim());
        }
        if (req.getFinalDiagnosis() != null) {
            record.setFinalDiagnosis(req.getFinalDiagnosis().trim());
        }
        if (req.getIcd10Code() != null) {
            record.setIcd10Code(req.getIcd10Code().trim().toUpperCase());
        }
        if (req.getDoctorAdvice() != null) {
            record.setDoctorAdvice(req.getDoctorAdvice().trim());
        }
        if (req.getFollowUpDate() != null) {
            record.setFollowUpDate(req.getFollowUpDate());
        }

        if (req.getStatus() != null && !req.getStatus().trim().isEmpty()) {
            record.setStatus(req.getStatus().trim());
        } else if (record.getStatus() == null) {
            record.setStatus("IN_PROGRESS");
        }

        MedicalRecord saved = medicalRecordRepository.save(record);

        // Nếu có ticketId, cập nhật ticket sang SERVING nếu đang CALLED hoặc WAITING
        if (req.getTicketId() != null) {
            queueTicketRepository.findById(req.getTicketId()).ifPresent(ticket -> {
                if ("WAITING".equals(ticket.getStatus()) || "CALLED".equals(ticket.getStatus())) {
                    ticket.setStatus("SERVING");
                    if (ticket.getServingAt() == null) {
                        ticket.setServingAt(LocalDateTime.now());
                    }
                    queueTicketRepository.save(ticket);
                }
            });
        }

        String patientName = patientRepository.findById(saved.getPatientId()).map(Patient::getFullName).orElse("");
        return mapToMedicalRecordSummary(saved, patientName);
    }

    // =========================================================================
    // UC-KB04: CHỈ ĐỊNH DỊCH VỤ CẬN LÂM SÀNG (BÁC SĨ)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ClinicalService> getAvailableServices() {
        return clinicalServiceRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public List<ServiceCategory> getServiceCategories() {
        return serviceCategoryRepository.findAll();
    }

    public LabOrderSummaryDto orderClinicalServices(OrderLabServicesRequest req) {
        if (req.getMedicalRecordId() == null) {
            throw new IllegalArgumentException("Mã hồ sơ bệnh án không được để trống khi chỉ định cận lâm sàng");
        }
        if (req.getServiceIds() == null || req.getServiceIds().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một dịch vụ cận lâm sàng");
        }

        MedicalRecord record = medicalRecordRepository.findById(req.getMedicalRecordId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh án với ID: " + req.getMedicalRecordId()));

        Long doctorId = req.getDoctorId() != null ? req.getDoctorId() : record.getDoctorId();
        Long patientId = req.getPatientId() != null ? req.getPatientId() : record.getPatientId();

        LabOrder order = new LabOrder();
        order.setOrderCode(generateLabOrderCode());
        order.setMedicalRecordId(record.getId());
        order.setDoctorId(doctorId);
        order.setPatientId(patientId);
        order.setDiagnosisNote(req.getDiagnosisNote());
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        LabOrder savedOrder = labOrderRepository.save(order);

        List<LabResult> results = new ArrayList<>();
        for (Long serviceId : req.getServiceIds()) {
            ClinicalService service = clinicalServiceRepository.findById(serviceId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ cận lâm sàng ID: " + serviceId));

            LabResult result = new LabResult();
            result.setLabOrderId(savedOrder.getId());
            result.setServiceId(service.getId());
            result.setStatus("WAITING");
            result.setCreatedAt(LocalDateTime.now());

            // Gợi ý khoảng tham chiếu mặc định theo mã dịch vụ
            setupDefaultReferenceRange(result, service.getCode());

            results.add(labResultRepository.save(result));
        }

        // Cập nhật trạng thái hồ sơ bệnh án sang WAITING_PARACLINICAL (Chờ kết quả cận lâm sàng)
        record.setStatus("WAITING_PARACLINICAL");
        medicalRecordRepository.save(record);

        return mapToLabOrderSummary(savedOrder, results);
    }

    // =========================================================================
    // UC-KB05: XEM KẾT QUẢ CẬN LÂM SÀNG (BÁC SĨ & KỸ THUẬT VIÊN)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<LabOrderSummaryDto> getAllLabOrders() {
        List<LabOrder> orders = labOrderRepository.findAll();
        orders.sort((a, b) -> {
            if (b.getCreatedAt() == null || a.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        return orders.stream()
                .map(order -> {
                    List<LabResult> results = labResultRepository.findByLabOrderId(order.getId());
                    return mapToLabOrderSummary(order, results);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LabOrderSummaryDto> getLabOrdersByRecord(Long medicalRecordId) {
        List<LabOrder> orders = labOrderRepository.findByMedicalRecordId(medicalRecordId);
        return orders.stream()
                .map(order -> {
                    List<LabResult> results = labResultRepository.findByLabOrderId(order.getId());
                    return mapToLabOrderSummary(order, results);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LabOrderSummaryDto> getLabOrdersByPatient(Long patientId) {
        List<LabOrder> orders = labOrderRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return orders.stream()
                .map(order -> {
                    List<LabResult> results = labResultRepository.findByLabOrderId(order.getId());
                    return mapToLabOrderSummary(order, results);
                })
                .collect(Collectors.toList());
    }

    public LabResultItemDto updateLabResult(UpdateLabResultRequest req) {
        if (req.getResultId() == null) {
            throw new IllegalArgumentException("Mã kết quả xét nghiệm không được để trống");
        }
        LabResult result = labResultRepository.findById(req.getResultId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chỉ định xét nghiệm ID: " + req.getResultId()));

        if (req.getTestValue() != null) result.setTestValue(req.getTestValue().trim());
        if (req.getReferenceRange() != null) result.setReferenceRange(req.getReferenceRange().trim());
        if (req.getUnit() != null) result.setUnit(req.getUnit().trim());
        if (req.getConclusion() != null) result.setConclusion(req.getConclusion().trim());
        if (req.getImageAttachmentUrl() != null) result.setImageAttachmentUrl(req.getImageAttachmentUrl().trim());

        Long techId = req.getTechnicianId();
        if (techId == null) {
            techId = staffRepository.findByStaffCode("KTV001").map(Staff::getId).orElse(5L);
        }
        result.setTechnicianId(techId);
        result.setStatus("COMPLETED");
        result.setCompletedAt(LocalDateTime.now());

        LabResult saved = labResultRepository.save(result);

        // Kiểm tra xem tất cả dịch vụ trong phiếu chỉ định này đã hoàn thành chưa
        List<LabResult> siblings = labResultRepository.findByLabOrderId(saved.getLabOrderId());
        boolean allCompleted = siblings.stream().allMatch(r -> "COMPLETED".equals(r.getStatus()));
        if (allCompleted) {
            labOrderRepository.findById(saved.getLabOrderId()).ifPresent(order -> {
                order.setStatus("COMPLETED");
                labOrderRepository.save(order);
            });
        }

        return mapToLabResultItemDto(saved);
    }

    // =========================================================================
    // UC-KB06: HẸN TÁI KHÁM (BÁC SĨ)
    // =========================================================================
    public MedicalRecordSummaryDto scheduleFollowUp(ScheduleFollowUpRequest req) {
        if (req.getMedicalRecordId() == null) {
            throw new IllegalArgumentException("Mã hồ sơ bệnh án không được để trống");
        }
        if (req.getFollowUpDate() == null) {
            throw new IllegalArgumentException("Ngày hẹn tái khám không được để trống");
        }
        if (req.getFollowUpDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày hẹn tái khám không thể trước ngày hiện tại");
        }

        MedicalRecord record = medicalRecordRepository.findById(req.getMedicalRecordId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh án ID: " + req.getMedicalRecordId()));

        record.setFollowUpDate(req.getFollowUpDate());
        if (req.getDoctorAdvice() != null && !req.getDoctorAdvice().trim().isEmpty()) {
            record.setDoctorAdvice(req.getDoctorAdvice().trim());
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        String patientName = patientRepository.findById(saved.getPatientId()).map(Patient::getFullName).orElse("");
        return mapToMedicalRecordSummary(saved, patientName);
    }

    // =========================================================================
    // UC-KB07: KẾT THÚC PHIÊN KHÁM (BÁC SĨ)
    // =========================================================================
    public MedicalRecordSummaryDto completeEncounter(CompleteEncounterRequest req) {
        MedicalRecord record = null;
        if (req.getMedicalRecordId() != null) {
            record = medicalRecordRepository.findById(req.getMedicalRecordId()).orElse(null);
        }

        // Tự động tìm hồ sơ đang IN_PROGRESS theo ticketId hoặc patientId nếu chưa có
        if (record == null && req.getTicketId() != null) {
            QueueTicket ticket = queueTicketRepository.findById(req.getTicketId()).orElse(null);
            if (ticket != null) {
                List<MedicalRecord> list = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(ticket.getPatientId());
                record = list.stream()
                        .filter(r -> "IN_PROGRESS".equals(r.getStatus()))
                        .findFirst()
                        .orElse(null);
            }
        }

        if (record == null && req.getPatientId() != null) {
            List<MedicalRecord> list = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(req.getPatientId());
            record = list.stream()
                    .filter(r -> "IN_PROGRESS".equals(r.getStatus()))
                    .findFirst()
                    .orElse(null);
        }

        // Nếu vẫn chưa có hồ sơ, tự động tạo mới để hoàn tất
        if (record == null) {
            Long patientId = req.getPatientId();
            if (patientId == null && req.getTicketId() != null) {
                patientId = queueTicketRepository.findById(req.getTicketId()).map(QueueTicket::getPatientId).orElse(null);
            }
            if (patientId == null) {
                throw new IllegalArgumentException("Không tìm thấy hồ sơ bệnh án và không xác định được mã bệnh nhân");
            }

            record = new MedicalRecord();
            record.setRecordCode(generateRecordCode());
            record.setPatientId(patientId);
            record.setDoctorId(req.getDoctorId() != null ? req.getDoctorId() : 2L);
            record.setRoomId(req.getRoomId() != null ? req.getRoomId() : 1L);
            record.setChiefComplaint(req.getChiefComplaint() != null && !req.getChiefComplaint().trim().isEmpty()
                    ? req.getChiefComplaint().trim() : "Khám bệnh hoàn tất");

            var optVs = vitalSignRepository.findFirstByPatientIdOrderByMeasuredAtDesc(patientId);
            if (optVs.isPresent()) {
                record.setVitalSignsId(optVs.get().getId());
            }
        }

        if (req.getFinalDiagnosis() != null && !req.getFinalDiagnosis().trim().isEmpty()) {
            record.setFinalDiagnosis(req.getFinalDiagnosis().trim());
        }

        // Nếu chẩn đoán xác định vẫn chưa có, tự động dùng chẩn đoán sơ bộ
        if ((record.getFinalDiagnosis() == null || record.getFinalDiagnosis().trim().isEmpty())
                && record.getInitialDiagnosis() != null && !record.getInitialDiagnosis().trim().isEmpty()) {
            record.setFinalDiagnosis(record.getInitialDiagnosis().trim());
        }

        // Nếu vẫn trống nhưng có mã ICD-10
        String icd = req.getIcd10Code() != null && !req.getIcd10Code().trim().isEmpty()
                ? req.getIcd10Code().trim().toUpperCase()
                : record.getIcd10Code();
        if ((record.getFinalDiagnosis() == null || record.getFinalDiagnosis().trim().isEmpty())
                && icd != null && !icd.trim().isEmpty()) {
            record.setFinalDiagnosis("Chẩn đoán theo mã " + icd);
        }

        if (record.getFinalDiagnosis() == null || record.getFinalDiagnosis().trim().isEmpty()) {
            throw new IllegalArgumentException("Bác sĩ phải nhập chẩn đoán xác định (hoặc chẩn đoán sơ bộ) trước khi kết thúc phiên khám");
        }

        if (icd != null) {
            record.setIcd10Code(icd);
        }
        if (req.getDoctorAdvice() != null) {
            record.setDoctorAdvice(req.getDoctorAdvice().trim());
        }
        if (req.getFollowUpDate() != null) {
            record.setFollowUpDate(req.getFollowUpDate());
        }

        record.setStatus("COMPLETED");
        MedicalRecord saved = medicalRecordRepository.save(record);

        // Tự động hoàn thành phiếu hàng đợi tương ứng (nếu có)
        Long ticketId = req.getTicketId();
        if (ticketId != null) {
            queueTicketRepository.findById(ticketId).ifPresent(ticket -> {
                ticket.setStatus("COMPLETED");
                ticket.setCompletedAt(LocalDateTime.now());
                queueTicketRepository.save(ticket);
            });
        } else {
            // Tìm số thứ tự của bệnh nhân hôm nay tại phòng khám này đang ở trạng thái SERVING hoặc CALLED
            List<QueueTicket> activeTickets = queueTicketRepository.findByPatientIdAndQueueDate(saved.getPatientId(), LocalDate.now());
            activeTickets.stream()
                    .filter(t -> t.getRoomId().equals(saved.getRoomId()) &&
                            ("SERVING".equals(t.getStatus()) || "CALLED".equals(t.getStatus())))
                    .findFirst()
                    .ifPresent(ticket -> {
                        ticket.setStatus("COMPLETED");
                        ticket.setCompletedAt(LocalDateTime.now());
                        queueTicketRepository.save(ticket);
                    });
        }

        // Cập nhật trạng thái Appointment nếu liên kết
        if (saved.getAppointmentId() != null) {
            appointmentRepository.findById(saved.getAppointmentId()).ifPresent(app -> {
                app.setStatus("COMPLETED");
                appointmentRepository.save(app);
            });
        }

        String patientName = patientRepository.findById(saved.getPatientId()).map(Patient::getFullName).orElse("");
        return mapToMedicalRecordSummary(saved, patientName);
    }

    // =========================================================================
    // UC-KB08: IN PHIẾU KHÁM / TÓM TẮT BỆNH ÁN (BÁC SĨ, LỄ TÂN)
    // =========================================================================
    @Transactional(readOnly = true)
    public MedicalSummaryPrintDto getEncounterSummaryPrint(Long recordId) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh án ID: " + recordId));

        Patient patient = patientRepository.findById(record.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin bệnh nhân"));

        MedicalSummaryPrintDto printDto = new MedicalSummaryPrintDto();
        printDto.setRecordId(record.getId());
        printDto.setRecordCode(record.getRecordCode());
        printDto.setExaminationDate(record.getCreatedAt());
        printDto.setStatus(record.getStatus());

        // Thông tin bệnh nhân
        printDto.setPatientId(patient.getId());
        printDto.setPatientCode(patient.getPatientCode());
        printDto.setPatientName(patient.getFullName());
        printDto.setGender("FEMALE".equalsIgnoreCase(patient.getGender()) ? "Nữ" : "Nam");
        printDto.setDateOfBirth(patient.getDateOfBirth());
        if (patient.getDateOfBirth() != null) {
            printDto.setAge(LocalDate.now().getYear() - patient.getDateOfBirth().getYear());
        }
        printDto.setPhone(patient.getPhone());
        printDto.setAddress(patient.getAddress());
        printDto.setHealthInsuranceNumber(patient.getHealthInsuranceNumber());
        printDto.setBloodGroup(patient.getBloodGroup());
        printDto.setDrugAllergies(patient.getDrugAllergies());

        // Bác sĩ & Phòng khám
        staffRepository.findById(record.getDoctorId()).ifPresent(doctor -> {
            printDto.setDoctorName(doctor.getFullName());
            printDto.setDoctorQualification(doctor.getQualification());
        });

        clinicRoomRepository.findById(record.getRoomId()).ifPresent(room -> {
            printDto.setRoomName(room.getName() + " (" + room.getRoomNumber() + ")");
            departmentRepository.findById(room.getDepartmentId()).ifPresent(dept -> {
                printDto.setDepartmentName(dept.getName());
            });
        });

        // Sinh hiệu
        if (record.getVitalSignsId() != null) {
            vitalSignRepository.findById(record.getVitalSignsId()).ifPresent(vs -> {
                printDto.setVitalSigns(mapToVitalSignResponse(vs, patient.getFullName()));
            });
        } else {
            // Lấy sinh hiệu đo gần nhất của bệnh nhân
            vitalSignRepository.findFirstByPatientIdOrderByMeasuredAtDesc(patient.getId()).ifPresent(vs -> {
                printDto.setVitalSigns(mapToVitalSignResponse(vs, patient.getFullName()));
            });
        }

        // Lâm sàng & Chẩn đoán
        printDto.setChiefComplaint(record.getChiefComplaint());
        printDto.setHistoryOfPresentIllness(record.getHistoryOfPresentIllness());
        printDto.setPhysicalExamination(record.getPhysicalExamination());
        printDto.setInitialDiagnosis(record.getInitialDiagnosis());
        printDto.setFinalDiagnosis(record.getFinalDiagnosis());
        printDto.setIcd10Code(record.getIcd10Code());
        printDto.setDoctorAdvice(record.getDoctorAdvice());
        printDto.setFollowUpDate(record.getFollowUpDate());

        // Cận lâm sàng & Kết quả
        List<LabOrder> orders = labOrderRepository.findByMedicalRecordId(record.getId());
        List<LabOrderSummaryDto> labOrders = orders.stream()
                .map(order -> {
                    List<LabResult> results = labResultRepository.findByLabOrderId(order.getId());
                    return mapToLabOrderSummary(order, results);
                })
                .collect(Collectors.toList());
        printDto.setLabOrders(labOrders);

        return printDto;
    }

    // =========================================================================
    // HELPER METHODS & MAPPERS
    // =========================================================================
    private String generateRecordCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = new Random().nextInt(9000) + 1000;
        return "BA" + datePrefix + randomSuffix;
    }

    private String generateLabOrderCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = new Random().nextInt(9000) + 1000;
        return "CLS" + datePrefix + randomSuffix;
    }

    private VitalSignResponse mapToVitalSignResponse(VitalSign vs, String patientName) {
        VitalSignResponse res = new VitalSignResponse();
        res.setId(vs.getId());
        res.setPatientId(vs.getPatientId());
        res.setPatientName(patientName);
        res.setNurseId(vs.getNurseId());
        res.setTemperature(vs.getTemperature());
        res.setBloodPressureSystolic(vs.getBloodPressureSystolic());
        res.setBloodPressureDiastolic(vs.getBloodPressureDiastolic());
        res.setHeartRate(vs.getHeartRate());
        res.setRespiratoryRate(vs.getRespiratoryRate());
        res.setSpo2(vs.getSpo2());
        res.setWeightKg(vs.getWeightKg());
        res.setHeightCm(vs.getHeightCm());
        res.setBmi(vs.getBmi());
        res.setNotes(vs.getNotes());
        res.setMeasuredAt(vs.getMeasuredAt());

        // Tên điều dưỡng
        staffRepository.findById(vs.getNurseId()).ifPresent(staff -> res.setNurseName(staff.getFullName()));

        // Phân loại BMI
        if (vs.getBmi() != null) {
            double bmi = vs.getBmi().doubleValue();
            if (bmi < 18.5) res.setBmiCategory("Thiếu cân");
            else if (bmi < 23.0) res.setBmiCategory("Bình thường");
            else if (bmi < 25.0) res.setBmiCategory("Tiền béo phì");
            else res.setBmiCategory("Béo phì");
        }

        // Đánh giá huyết áp
        if (vs.getBloodPressureSystolic() != null && vs.getBloodPressureDiastolic() != null) {
            int sys = vs.getBloodPressureSystolic();
            int dia = vs.getBloodPressureDiastolic();
            if (sys < 120 && dia < 80) res.setBloodPressureStatus("Huyết áp tối ưu");
            else if (sys < 130 && dia < 85) res.setBloodPressureStatus("Huyết áp bình thường");
            else if (sys < 140 && dia < 90) res.setBloodPressureStatus("Tiền tăng huyết áp");
            else if (sys >= 160 || dia >= 100) res.setBloodPressureStatus("Tăng huyết áp độ 2 (Nguy cơ)");
            else res.setBloodPressureStatus("Tăng huyết áp độ 1");
        }

        // Đánh giá nhiệt độ
        if (vs.getTemperature() != null) {
            double t = vs.getTemperature().doubleValue();
            if (t < 36.0) res.setTemperatureStatus("Hạ thân nhiệt");
            else if (t <= 37.4) res.setTemperatureStatus("Bình thường");
            else if (t <= 38.4) res.setTemperatureStatus("Sốt nhẹ");
            else res.setTemperatureStatus("Sốt cao");
        }

        return res;
    }

    private MedicalRecordSummaryDto mapToMedicalRecordSummary(MedicalRecord rec, String patientName) {
        MedicalRecordSummaryDto dto = new MedicalRecordSummaryDto();
        dto.setId(rec.getId());
        dto.setRecordCode(rec.getRecordCode());
        dto.setPatientId(rec.getPatientId());
        dto.setPatientName(patientName);
        dto.setDoctorId(rec.getDoctorId());
        dto.setRoomId(rec.getRoomId());
        dto.setChiefComplaint(rec.getChiefComplaint());
        dto.setInitialDiagnosis(rec.getInitialDiagnosis());
        dto.setFinalDiagnosis(rec.getFinalDiagnosis());
        dto.setIcd10Code(rec.getIcd10Code());
        dto.setDoctorAdvice(rec.getDoctorAdvice());
        dto.setFollowUpDate(rec.getFollowUpDate());
        dto.setStatus(rec.getStatus());
        dto.setCreatedAt(rec.getCreatedAt());

        staffRepository.findById(rec.getDoctorId()).ifPresent(doc -> dto.setDoctorName(doc.getFullName()));
        clinicRoomRepository.findById(rec.getRoomId()).ifPresent(room -> dto.setRoomName(room.getName()));

        if (rec.getVitalSignsId() != null) {
            vitalSignRepository.findById(rec.getVitalSignsId())
                    .ifPresent(vs -> dto.setVitalSigns(mapToVitalSignResponse(vs, patientName)));
        }

        List<LabOrder> orders = labOrderRepository.findByMedicalRecordId(rec.getId());
        dto.setLabOrders(orders.stream().map(o -> {
            List<LabResult> r = labResultRepository.findByLabOrderId(o.getId());
            return mapToLabOrderSummary(o, r);
        }).collect(Collectors.toList()));

        return dto;
    }

    private LabOrderSummaryDto mapToLabOrderSummary(LabOrder order, List<LabResult> results) {
        LabOrderSummaryDto dto = new LabOrderSummaryDto();
        dto.setId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        dto.setMedicalRecordId(order.getMedicalRecordId());
        dto.setDoctorId(order.getDoctorId());
        dto.setPatientId(order.getPatientId());
        dto.setDiagnosisNote(order.getDiagnosisNote());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());

        staffRepository.findById(order.getDoctorId()).ifPresent(s -> dto.setDoctorName(s.getFullName()));
        patientRepository.findById(order.getPatientId()).ifPresent(p -> dto.setPatientName(p.getFullName()));

        List<LabResultItemDto> itemDtos = results.stream()
                .map(this::mapToLabResultItemDto)
                .collect(Collectors.toList());
        dto.setItems(itemDtos);

        return dto;
    }

    private LabResultItemDto mapToLabResultItemDto(LabResult result) {
        LabResultItemDto dto = new LabResultItemDto();
        dto.setId(result.getId());
        dto.setLabOrderId(result.getLabOrderId());
        dto.setServiceId(result.getServiceId());
        dto.setTechnicianId(result.getTechnicianId());
        dto.setRoomId(result.getRoomId());
        dto.setTestValue(result.getTestValue());
        dto.setReferenceRange(result.getReferenceRange());
        dto.setUnit(result.getUnit());
        dto.setConclusion(result.getConclusion());
        dto.setImageAttachmentUrl(result.getImageAttachmentUrl());
        dto.setStatus(result.getStatus());
        dto.setCompletedAt(result.getCompletedAt());

        clinicalServiceRepository.findById(result.getServiceId()).ifPresent(service -> {
            dto.setServiceCode(service.getCode());
            dto.setServiceName(service.getName());
            dto.setPrice(service.getPrice());
            serviceCategoryRepository.findById(service.getCategoryId())
                    .ifPresent(cat -> dto.setCategoryName(cat.getName()));
        });

        if (result.getTechnicianId() != null) {
            staffRepository.findById(result.getTechnicianId()).ifPresent(t -> dto.setTechnicianName(t.getFullName()));
        }
        if (result.getRoomId() != null) {
            clinicRoomRepository.findById(result.getRoomId()).ifPresent(r -> dto.setRoomName(r.getName()));
        }

        return dto;
    }

    private void setupDefaultReferenceRange(LabResult result, String serviceCode) {
        if ("XN_CONGTHUCMAU".equalsIgnoreCase(serviceCode)) {
            result.setReferenceRange("12.0 - 16.5");
            result.setUnit("g/dL (Hb)");
        } else if ("XN_DUONGHUYET".equalsIgnoreCase(serviceCode)) {
            result.setReferenceRange("3.9 - 6.4");
            result.setUnit("mmol/L");
        } else if ("XN_MENGAN".equalsIgnoreCase(serviceCode)) {
            result.setReferenceRange("< 40");
            result.setUnit("U/L");
        } else if ("SA_OBUNG".equalsIgnoreCase(serviceCode)) {
            result.setReferenceRange("Hình ảnh siêu âm bình thường");
            result.setUnit("Khảo sát 4D");
        } else if ("XQ_NGUCTHANG".equalsIgnoreCase(serviceCode)) {
            result.setReferenceRange("Tim phổi bình thường không tổn thương");
            result.setUnit("DR Phim số");
        } else if ("NS_TMH".equalsIgnoreCase(serviceCode)) {
            result.setReferenceRange("Niêm mạc hồng hào, sạch");
            result.setUnit("Ống mềm HD");
        }
    }
}
