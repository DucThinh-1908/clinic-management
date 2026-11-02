package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.PharmacyDtos.*;
import com.clinic.clinic_management.entity.*;
import com.clinic.clinic_management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PharmacyService {

    private final MedicineCategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;
    private final StockTransactionRepository transactionRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final DispensationRepository dispensationRepository;
    private final PatientRepository patientRepository;
    private final StaffRepository staffRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public PharmacyService(
            MedicineCategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            MedicineRepository medicineRepository,
            MedicineBatchRepository batchRepository,
            StockTransactionRepository transactionRepository,
            PrescriptionRepository prescriptionRepository,
            PrescriptionItemRepository prescriptionItemRepository,
            DispensationRepository dispensationRepository,
            PatientRepository patientRepository,
            StaffRepository staffRepository,
            MedicalRecordRepository medicalRecordRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.transactionRepository = transactionRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionItemRepository = prescriptionItemRepository;
        this.dispensationRepository = dispensationRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    // =========================================================================
    // UC-DT01: KÊ ĐƠN THUỐC (BÁC SĨ)
    // =========================================================================
    public PrescriptionResponse createPrescription(CreatePrescriptionRequest req) {
        if (req.getPatientId() == null) {
            throw new IllegalArgumentException("Mã bệnh nhân không được để trống khi kê đơn");
        }
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("Đơn thuốc phải có ít nhất một loại thuốc");
        }

        Prescription prescription = new Prescription();
        prescription.setPrescriptionCode(generatePrescriptionCode());
        if (req.getMedicalRecordId() != null) {
            prescription.setMedicalRecordId(req.getMedicalRecordId());
        } else if (req.getPatientId() != null) {
            var recs = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(req.getPatientId());
            prescription.setMedicalRecordId(!recs.isEmpty() ? recs.get(0).getId() : 1L);
        } else {
            prescription.setMedicalRecordId(1L);
        }
        prescription.setDoctorId(req.getDoctorId() != null ? req.getDoctorId() : 2L);
        prescription.setPatientId(req.getPatientId());
        prescription.setDiagnosis(req.getDiagnosis() != null && !req.getDiagnosis().trim().isEmpty()
                ? req.getDiagnosis().trim() : "Chẩn đoán lâm sàng");
        prescription.setUsageNote(req.getUsageNote());
        prescription.setStatus("PENDING_PAYMENT");
        prescription.setCreatedAt(LocalDateTime.now());

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<PrescriptionItem> savedItems = new ArrayList<>();

        for (PrescriptionItemRequest itemReq : req.getItems()) {
            if (itemReq.getMedicineId() == null) continue;
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng thuốc kê đơn phải lớn hơn 0");
            }

            Medicine med = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new IllegalArgumentException("Thuốc không tồn tại với ID: " + itemReq.getMedicineId()));

            PrescriptionItem item = new PrescriptionItem();
            item.setPrescriptionId(savedPrescription.getId());
            item.setMedicineId(med.getId());
            item.setQuantity(itemReq.getQuantity());
            item.setMorningDose(itemReq.getMorningDose() != null ? itemReq.getMorningDose() : "0");
            item.setNoonDose(itemReq.getNoonDose() != null ? itemReq.getNoonDose() : "0");
            item.setAfternoonDose(itemReq.getAfternoonDose() != null ? itemReq.getAfternoonDose() : "0");
            item.setNightDose(itemReq.getNightDose() != null ? itemReq.getNightDose() : "0");
            item.setInstructions(itemReq.getInstructions() != null ? itemReq.getInstructions() : med.getUsageInstructions());
            item.setUnitPrice(med.getSellingPrice());

            BigDecimal total = med.getSellingPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            item.setTotalAmount(total);

            savedItems.add(prescriptionItemRepository.save(item));
            grandTotal = grandTotal.add(total);
        }

        return mapToPrescriptionResponse(savedPrescription, savedItems, grandTotal);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn thuốc với ID: " + id));
        List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionId(id);
        BigDecimal total = items.stream().map(PrescriptionItem::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return mapToPrescriptionResponse(prescription, items, total);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPrescriptionsByPatient(Long patientId) {
        List<Prescription> list = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return list.stream().map(p -> {
            List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionId(p.getId());
            BigDecimal total = items.stream().map(PrescriptionItem::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            return mapToPrescriptionResponse(p, items, total);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions(String status) {
        List<Prescription> list = status != null && !status.trim().isEmpty()
                ? prescriptionRepository.findByStatusOrderByCreatedAtDesc(status.trim())
                : prescriptionRepository.findAllByOrderByCreatedAtDesc();

        return list.stream().map(p -> {
            List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionId(p.getId());
            BigDecimal total = items.stream().map(PrescriptionItem::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            return mapToPrescriptionResponse(p, items, total);
        }).collect(Collectors.toList());
    }

    // =========================================================================
    // UC-DT02: CẢNH BÁO DỊ ỨNG KHI KÊ ĐƠN (HỆ THỐNG)
    // =========================================================================
    @Transactional(readOnly = true)
    public AllergyAlertResponse checkAllergies(AllergyCheckRequest req) {
        AllergyAlertResponse resp = new AllergyAlertResponse();
        if (req.getPatientId() == null || req.getMedicineIds() == null || req.getMedicineIds().isEmpty()) {
            resp.setHasRisk(false);
            return resp;
        }

        Patient patient = patientRepository.findById(req.getPatientId()).orElse(null);
        if (patient == null || patient.getDrugAllergies() == null || patient.getDrugAllergies().trim().isEmpty()) {
            resp.setHasRisk(false);
            return resp;
        }

        String allergies = patient.getDrugAllergies().trim();
        resp.setPatientAllergies(allergies);

        // Chuẩn hóa chuỗi dị ứng thành các từ khóa
        String lowerAllergies = allergies.toLowerCase();
        if (lowerAllergies.contains("không có") || lowerAllergies.contains("chưa ghi nhận") || lowerAllergies.contains("ko")) {
            resp.setHasRisk(false);
            return resp;
        }

        // Tách các từ khóa dị ứng theo dấu phẩy, chấm phẩy, gạch đầu dòng
        String[] rawTokens = lowerAllergies.split("[,;\\n\\r-]+");
        List<String> keywords = Arrays.stream(rawTokens)
                .map(String::trim)
                .filter(s -> s.length() >= 3)
                .collect(Collectors.toList());

        List<AllergyWarningItem> warnings = new ArrayList<>();

        for (Long medId : req.getMedicineIds()) {
            if (medId == null) continue;
            Medicine med = medicineRepository.findById(medId).orElse(null);
            if (med == null) continue;

            String active = (med.getActiveIngredient() != null ? med.getActiveIngredient() : "").toLowerCase();
            String brand = (med.getBrandName() != null ? med.getBrandName() : "").toLowerCase();
            String contra = (med.getContraindications() != null ? med.getContraindications() : "").toLowerCase();

            for (String kw : keywords) {
                boolean matchActive = active.contains(kw);
                boolean matchBrand = brand.contains(kw);
                boolean matchContra = contra.contains(kw);

                // Kiểm tra chéo một số nhóm kháng sinh/giảm đau quen thuộc
                boolean crossParacetamol = (kw.contains("paracetamol") || kw.contains("panadol") || kw.contains("acetaminophen"))
                        && (active.contains("paracetamol") || brand.contains("panadol"));
                boolean crossPenicillin = (kw.contains("penicillin") || kw.contains("amoxicillin") || kw.contains("augmentin"))
                        && (active.contains("amoxicillin") || active.contains("clavulanic") || brand.contains("augmentin"));
                boolean crossAspirin = (kw.contains("aspirin") || kw.contains("nsaid"))
                        && (active.contains("aspirin") || active.contains("ibuprofen"));

                if (matchActive || matchBrand || matchContra || crossParacetamol || crossPenicillin || crossAspirin) {
                    AllergyWarningItem warn = new AllergyWarningItem();
                    warn.setMedicineId(med.getId());
                    warn.setBrandName(med.getBrandName());
                    warn.setActiveIngredient(med.getActiveIngredient());
                    warn.setMatchedAllergyKeyword(kw);
                    warn.setSeverity("HIGH");
                    warn.setMessage("Cảnh báo nguy cơ dị ứng nghiêm trọng: Bệnh nhân có tiền sử dị ứng với '" + kw +
                            "'. Thuốc '" + med.getBrandName() + "' có chứa hoạt chất '" + med.getActiveIngredient() + "'.");
                    warnings.add(warn);
                    break;
                }
            }
        }

        resp.setWarnings(warnings);
        resp.setHasRisk(!warnings.isEmpty());
        return resp;
    }

    // =========================================================================
    // UC-DT03: IN ĐƠN THUỐC CHUẨN A4 (BÁC SĨ, DƯỢC SĨ)
    // =========================================================================
    @Transactional(readOnly = true)
    public PrescriptionPrintDto getPrescriptionPrintData(Long prescriptionId) {
        Prescription p = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn thuốc với ID: " + prescriptionId));

        PrescriptionPrintDto dto = new PrescriptionPrintDto();
        dto.setPrescriptionId(p.getId());
        dto.setPrescriptionCode(p.getPrescriptionCode());
        dto.setCreatedAt(p.getCreatedAt());

        if (p.getMedicalRecordId() != null) {
            medicalRecordRepository.findById(p.getMedicalRecordId()).ifPresent(mr -> {
                dto.setRecordCode(mr.getRecordCode());
                dto.setIcd10Code(mr.getIcd10Code());
                dto.setDoctorAdvice(mr.getDoctorAdvice());
                dto.setFollowUpDate(mr.getFollowUpDate());
            });
        }

        dto.setDiagnosis(p.getDiagnosis());

        patientRepository.findById(p.getPatientId()).ifPresent(pat -> {
            dto.setPatientId(pat.getId());
            dto.setPatientCode(pat.getPatientCode());
            dto.setPatientName(pat.getFullName());
            dto.setGender("FEMALE".equalsIgnoreCase(pat.getGender()) ? "Nữ" : "Nam");
            dto.setDateOfBirth(pat.getDateOfBirth());
            dto.setPhone(pat.getPhone());
            dto.setAddress(pat.getAddress());
            dto.setHealthInsuranceNumber(pat.getHealthInsuranceNumber());
            if (pat.getDateOfBirth() != null) {
                dto.setAge(LocalDate.now().getYear() - pat.getDateOfBirth().getYear());
            }
        });

        staffRepository.findById(p.getDoctorId()).ifPresent(doc -> dto.setDoctorName(doc.getFullName()));

        dispensationRepository.findByPrescriptionId(p.getId()).ifPresent(disp -> {
            dto.setPharmacistName(getPharmacistDisplayName(disp.getPharmacistId()));
        });

        List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionId(p.getId());
        BigDecimal total = BigDecimal.ZERO;
        List<PrescriptionItemResponse> itemResponses = new ArrayList<>();

        for (PrescriptionItem it : items) {
            PrescriptionItemResponse itemDto = mapToPrescriptionItemResponse(it);
            itemResponses.add(itemDto);
            total = total.add(it.getTotalAmount());
        }

        dto.setItems(itemResponses);
        dto.setTotalAmount(total);
        return dto;
    }

    // =========================================================================
    // UC-DT04: CẤP PHÁT THUỐC THEO ĐƠN (DƯỢC SĨ)
    // =========================================================================
    public DispensationResponse dispensePrescription(DispensePrescriptionRequest req) {
        if (req.getPrescriptionId() == null) {
            throw new IllegalArgumentException("Mã đơn thuốc không được để trống khi cấp phát");
        }

        Prescription prescription = prescriptionRepository.findById(req.getPrescriptionId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn thuốc với ID: " + req.getPrescriptionId()));

        if ("DISPENSED".equalsIgnoreCase(prescription.getStatus())) {
            throw new IllegalArgumentException("Đơn thuốc này đã được cấp phát trước đó");
        }
        if ("CANCELLED".equalsIgnoreCase(prescription.getStatus())) {
            throw new IllegalArgumentException("Không thể cấp phát đơn thuốc đã bị hủy");
        }

        List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionId(prescription.getId());
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Đơn thuốc không có danh mục thuốc để cấp phát");
        }

        LocalDate today = LocalDate.now();
        Long pharmacistId = resolvePharmacistStaffId(req.getPharmacistId());

        // 1. Kiểm tra tồn kho theo từng loại thuốc (FEFO)
        for (PrescriptionItem item : items) {
            Integer totalAvailable = batchRepository.getTotalAvailableQuantityForMedicine(item.getMedicineId(), today);
            if (totalAvailable < item.getQuantity()) {
                Medicine med = medicineRepository.findById(item.getMedicineId()).orElse(null);
                String medName = med != null ? med.getBrandName() : "ID " + item.getMedicineId();
                throw new IllegalArgumentException("Thuốc '" + medName + "' không đủ tồn kho để cấp phát (Cần "
                        + item.getQuantity() + ", hiện còn khả dụng " + totalAvailable + ")");
            }
        }

        // 2. Trừ tồn kho chi tiết theo lô (FEFO - hết hạn trước xuất trước)
        for (PrescriptionItem item : items) {
            int remainingNeeded = item.getQuantity();
            List<MedicineBatch> availableBatches = batchRepository.findByMedicineIdAndQuantityAvailableGreaterThanOrderByExpiryDateAsc(
                    item.getMedicineId(), 0
            );

            for (MedicineBatch batch : availableBatches) {
                if (batch.getExpiryDate().isBefore(today)) {
                    continue; // Bỏ qua lô đã hết hạn
                }

                int deduct = Math.min(batch.getQuantityAvailable(), remainingNeeded);
                batch.setQuantityAvailable(batch.getQuantityAvailable() - deduct);
                batchRepository.save(batch);

                // Ghi nhận lịch sử giao dịch xuất kho
                StockTransaction tx = new StockTransaction();
                tx.setBatchId(batch.getId());
                tx.setPharmacistId(pharmacistId);
                tx.setTransactionType("DISPENSE");
                tx.setQuantity(deduct);
                tx.setReason("Xuất cấp phát theo đơn thuốc " + prescription.getPrescriptionCode());
                tx.setTransactionDate(LocalDateTime.now());
                transactionRepository.save(tx);

                remainingNeeded -= deduct;
                if (remainingNeeded <= 0) break;
            }

            if (remainingNeeded > 0) {
                throw new IllegalStateException("Lỗi hệ thống khi trừ kho lô thuốc ID " + item.getMedicineId());
            }
        }

        // 3. Cập nhật trạng thái đơn thuốc sang DISPENSED
        prescription.setStatus("DISPENSED");
        prescriptionRepository.save(prescription);

        // 4. Tạo phiếu cấp phát
        Dispensation dispensation = new Dispensation();
        dispensation.setDispensationCode(generateDispensationCode());
        dispensation.setPrescriptionId(prescription.getId());
        dispensation.setPharmacistId(pharmacistId);
        dispensation.setDispensedAt(LocalDateTime.now());
        dispensation.setNote(req.getNote() != null && !req.getNote().trim().isEmpty()
                ? req.getNote().trim() : "Đã kiểm tra hạn dùng, hướng dẫn liều dùng đầy đủ");

        Dispensation savedDisp = dispensationRepository.save(dispensation);

        DispensationResponse resp = new DispensationResponse();
        resp.setId(savedDisp.getId());
        resp.setDispensationCode(savedDisp.getDispensationCode());
        resp.setPrescriptionId(prescription.getId());
        resp.setPrescriptionCode(prescription.getPrescriptionCode());
        resp.setPharmacistId(pharmacistId);
        resp.setPharmacistName(getPharmacistDisplayName(pharmacistId));
        patientRepository.findById(prescription.getPatientId()).ifPresent(p -> resp.setPatientName(p.getFullName()));
        resp.setDispensedAt(savedDisp.getDispensedAt());
        resp.setNote(savedDisp.getNote());
        return resp;
    }

    // =========================================================================
    // UC-DT05: QUẢN LÝ DANH MỤC THUỐC (DƯỢC SĨ)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<MedicineDetailDto> getAllMedicines(String query, Long categoryId) {
        List<Medicine> list;
        if (query != null && !query.trim().isEmpty()) {
            list = medicineRepository.searchMedicines(query.trim());
        } else if (categoryId != null) {
            list = medicineRepository.findByCategoryIdAndIsActiveTrue(categoryId);
        } else {
            list = medicineRepository.findAll();
        }

        LocalDate today = LocalDate.now();
        return list.stream().map(med -> {
            MedicineDetailDto dto = mapToMedicineDetailDto(med);
            Integer stock = batchRepository.getTotalAvailableQuantityForMedicine(med.getId(), today);
            dto.setTotalAvailableQuantity(stock != null ? stock : 0);
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicineDetailDto getMedicineById(Long id) {
        Medicine med = medicineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thuốc với ID: " + id));
        MedicineDetailDto dto = mapToMedicineDetailDto(med);
        Integer stock = batchRepository.getTotalAvailableQuantityForMedicine(med.getId(), LocalDate.now());
        dto.setTotalAvailableQuantity(stock != null ? stock : 0);
        return dto;
    }

    public MedicineDetailDto saveMedicine(SaveMedicineRequest req) {
        if (req.getBrandName() == null || req.getBrandName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên biệt dược không được để trống");
        }
        if (req.getActiveIngredient() == null || req.getActiveIngredient().trim().isEmpty()) {
            throw new IllegalArgumentException("Hoạt chất không được để trống");
        }
        if (req.getCategoryId() == null) {
            throw new IllegalArgumentException("Nhóm thuốc không được để trống");
        }

        Medicine med;
        if (req.getId() != null) {
            med = medicineRepository.findById(req.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thuốc để cập nhật với ID: " + req.getId()));
        } else {
            med = new Medicine();
            med.setCode(req.getCode() != null && !req.getCode().trim().isEmpty()
                    ? req.getCode().trim().toUpperCase() : generateMedicineCode());
        }

        med.setCategoryId(req.getCategoryId());
        med.setBrandName(req.getBrandName().trim());
        med.setActiveIngredient(req.getActiveIngredient().trim());
        med.setDosageForm(req.getDosageForm() != null ? req.getDosageForm().trim() : "Viên");
        med.setUnit(req.getUnit() != null ? req.getUnit().trim() : "Viên");
        med.setUsageInstructions(req.getUsageInstructions());
        med.setSellingPrice(req.getSellingPrice() != null ? req.getSellingPrice() : BigDecimal.ZERO);
        med.setIsPrescriptionRequired(req.getIsPrescriptionRequired() != null ? req.getIsPrescriptionRequired() : true);
        med.setContraindications(req.getContraindications());
        med.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        Medicine saved = medicineRepository.save(med);
        MedicineDetailDto dto = mapToMedicineDetailDto(saved);
        Integer stock = batchRepository.getTotalAvailableQuantityForMedicine(saved.getId(), LocalDate.now());
        dto.setTotalAvailableQuantity(stock != null ? stock : 0);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<MedicineCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    public MedicineCategory saveCategory(MedicineCategory cat) {
        if (cat.getName() == null || cat.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên nhóm thuốc không được để trống");
        }
        if (cat.getCode() == null || cat.getCode().trim().isEmpty()) {
            cat.setCode("CAT_" + System.currentTimeMillis() % 100000);
        }
        return categoryRepository.save(cat);
    }

    // =========================================================================
    // UC-DT06: NHẬP KHO THUỐC (DƯỢC SĨ)
    // =========================================================================
    public BatchDetailDto importStock(ImportStockRequest req) {
        if (req.getMedicineId() == null) {
            throw new IllegalArgumentException("Chưa chọn loại thuốc để nhập kho");
        }
        if (req.getQuantityImported() == null || req.getQuantityImported() <= 0) {
            throw new IllegalArgumentException("Số lượng nhập kho phải lớn hơn 0");
        }
        if (req.getExpiryDate() == null) {
            throw new IllegalArgumentException("Hạn sử dụng không được để trống");
        }
        if (req.getExpiryDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Hạn sử dụng phải ở tương lai, không thể nhập thuốc đã hết hạn");
        }

        Medicine med = medicineRepository.findById(req.getMedicineId())
                .orElseThrow(() -> new IllegalArgumentException("Thuốc không tồn tại với ID: " + req.getMedicineId()));

        MedicineBatch batch = new MedicineBatch();
        batch.setMedicineId(med.getId());
        batch.setSupplierId(req.getSupplierId());
        batch.setBatchNumber(req.getBatchNumber() != null && !req.getBatchNumber().trim().isEmpty()
                ? req.getBatchNumber().trim() : generateBatchNumber());
        batch.setManufactureDate(req.getManufactureDate());
        batch.setExpiryDate(req.getExpiryDate());
        batch.setImportPrice(req.getImportPrice() != null ? req.getImportPrice() : BigDecimal.ZERO);
        batch.setQuantityImported(req.getQuantityImported());
        batch.setQuantityAvailable(req.getQuantityImported());
        batch.setCreatedAt(LocalDateTime.now());

        MedicineBatch savedBatch = batchRepository.save(batch);

        Long pharmacistId = resolvePharmacistStaffId(req.getPharmacistId());
        StockTransaction tx = new StockTransaction();
        tx.setBatchId(savedBatch.getId());
        tx.setPharmacistId(pharmacistId);
        tx.setTransactionType("IMPORT");
        tx.setQuantity(req.getQuantityImported());
        tx.setReason(req.getNote() != null && !req.getNote().trim().isEmpty()
                ? req.getNote().trim() : "Nhập kho theo lô " + savedBatch.getBatchNumber());
        tx.setTransactionDate(LocalDateTime.now());
        transactionRepository.save(tx);

        return mapToBatchDetailDto(savedBatch);
    }

    // =========================================================================
    // UC-DT07: KIỂM KÊ TỒN KHO THUỐC (DƯỢC SĨ)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<BatchDetailDto> getAllBatches(Long medicineId) {
        List<MedicineBatch> list = medicineId != null
                ? batchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId)
                : batchRepository.findAll();

        return list.stream().map(this::mapToBatchDetailDto).collect(Collectors.toList());
    }

    public BatchDetailDto auditStock(StockAuditRequest req) {
        if (req.getBatchId() == null) {
            throw new IllegalArgumentException("Mã lô thuốc không được để trống khi kiểm kê");
        }
        if (req.getActualQuantity() == null || req.getActualQuantity() < 0) {
            throw new IllegalArgumentException("Số lượng kiểm kê thực tế không được âm");
        }

        MedicineBatch batch = batchRepository.findById(req.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lô thuốc với ID: " + req.getBatchId()));

        int oldQuantity = batch.getQuantityAvailable();
        int difference = req.getActualQuantity() - oldQuantity;

        batch.setQuantityAvailable(req.getActualQuantity());
        MedicineBatch updated = batchRepository.save(batch);

        Long pharmacistId = resolvePharmacistStaffId(req.getPharmacistId());
        StockTransaction tx = new StockTransaction();
        tx.setBatchId(batch.getId());
        tx.setPharmacistId(pharmacistId);
        tx.setTransactionType("AUDIT_ADJUSTMENT");
        tx.setQuantity(Math.abs(difference));
        tx.setReason((difference >= 0 ? "Kiểm kê tăng: +" : "Kiểm kê giảm: ") + difference + " | Lý do: "
                + (req.getReason() != null ? req.getReason() : "Điều chỉnh kiểm kê định kỳ"));
        tx.setTransactionDate(LocalDateTime.now());
        transactionRepository.save(tx);

        return mapToBatchDetailDto(updated);
    }

    // =========================================================================
    // UC-DT08: CẢNH BÁO THUỐC SẮP HẾT / SẮP HẾT HẠN (HỆ THỐNG, DƯỢC SĨ)
    // =========================================================================
    @Transactional(readOnly = true)
    public StockAlertOverviewDto getStockAlerts(Integer lowStockThreshold, Integer nearExpiryDays) {
        int threshold = lowStockThreshold != null ? lowStockThreshold : 20;
        int days = nearExpiryDays != null ? nearExpiryDays : 60;
        LocalDate today = LocalDate.now();
        LocalDate expiryThreshold = today.plusDays(days);

        StockAlertOverviewDto overview = new StockAlertOverviewDto();
        List<StockAlertItemDto> alertList = new ArrayList<>();

        // 1. Kiểm tra tồn kho sắp hết theo danh mục thuốc
        List<Medicine> activeMedicines = medicineRepository.findByIsActiveTrue();
        int lowStockCount = 0;
        for (Medicine m : activeMedicines) {
            Integer totalAvailable = batchRepository.getTotalAvailableQuantityForMedicine(m.getId(), today);
            int available = totalAvailable != null ? totalAvailable : 0;
            if (available <= threshold) {
                lowStockCount++;
                StockAlertItemDto alert = new StockAlertItemDto();
                alert.setAlertType("LOW_STOCK");
                alert.setMedicineId(m.getId());
                alert.setMedicineCode(m.getCode());
                alert.setBrandName(m.getBrandName());
                alert.setActiveIngredient(m.getActiveIngredient());
                alert.setUnit(m.getUnit());
                alert.setQuantityAvailable(available);
                alert.setThreshold(threshold);
                alert.setSeverity(available == 0 ? "CRITICAL" : "WARNING");
                alert.setMessage(available == 0
                        ? "Hết hàng hoàn toàn: Thuốc " + m.getBrandName() + " hiện đã hết tồn kho khả dụng."
                        : "Sắp hết hàng: Thuốc " + m.getBrandName() + " chỉ còn tồn " + available + " " + m.getUnit() + " (ngưỡng an toàn: " + threshold + ").");
                alertList.add(alert);
            }
        }
        overview.setLowStockCount(lowStockCount);

        // 2. Kiểm tra các lô thuốc sắp hết hạn hoặc đã hết hạn
        List<MedicineBatch> allBatches = batchRepository.findAll();
        int nearExpiryCount = 0;
        int expiredCount = 0;

        for (MedicineBatch b : allBatches) {
            if (b.getQuantityAvailable() <= 0) continue; // Lô đã xuất hết không cần cảnh báo

            Medicine med = medicineRepository.findById(b.getMedicineId()).orElse(null);
            String medName = med != null ? med.getBrandName() : "ID " + b.getMedicineId();
            String unit = med != null ? med.getUnit() : "Đơn vị";

            long daysRemaining = ChronoUnit.DAYS.between(today, b.getExpiryDate());

            if (daysRemaining < 0) {
                // Đã hết hạn
                expiredCount++;
                StockAlertItemDto alert = new StockAlertItemDto();
                alert.setAlertType("EXPIRED");
                alert.setBatchId(b.getId());
                alert.setBatchNumber(b.getBatchNumber());
                alert.setMedicineId(b.getMedicineId());
                alert.setBrandName(medName);
                alert.setUnit(unit);
                alert.setQuantityAvailable(b.getQuantityAvailable());
                alert.setExpiryDate(b.getExpiryDate());
                alert.setDaysRemaining(daysRemaining);
                alert.setSeverity("CRITICAL");
                alert.setMessage("Đã quá hạn sử dụng: Lô " + b.getBatchNumber() + " của thuốc " + medName
                        + " đã hết hạn từ ngày " + b.getExpiryDate() + " (còn tồn " + b.getQuantityAvailable() + " " + unit + "). Cần hủy ngay!");
                alertList.add(alert);
            } else if (daysRemaining <= days) {
                // Sắp hết hạn
                nearExpiryCount++;
                StockAlertItemDto alert = new StockAlertItemDto();
                alert.setAlertType("NEAR_EXPIRY");
                alert.setBatchId(b.getId());
                alert.setBatchNumber(b.getBatchNumber());
                alert.setMedicineId(b.getMedicineId());
                alert.setBrandName(medName);
                alert.setUnit(unit);
                alert.setQuantityAvailable(b.getQuantityAvailable());
                alert.setExpiryDate(b.getExpiryDate());
                alert.setDaysRemaining(daysRemaining);
                alert.setSeverity(daysRemaining <= 15 ? "CRITICAL" : "WARNING");
                alert.setMessage("Sắp hết hạn sử dụng: Lô " + b.getBatchNumber() + " của thuốc " + medName
                        + " còn " + daysRemaining + " ngày là hết hạn (" + b.getExpiryDate() + ", tồn " + b.getQuantityAvailable() + " " + unit + ").");
                alertList.add(alert);
            }
        }

        overview.setNearExpiryCount(nearExpiryCount);
        overview.setExpiredCount(expiredCount);
        overview.setAlerts(alertList);
        return overview;
    }

    // =========================================================================
    // UC-DT09: QUẢN LÝ NHÀ CUNG CẤP (DƯỢC SĨ)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<SupplierDetailDto> getAllSuppliers() {
        List<Supplier> list = supplierRepository.findAll();
        return list.stream().map(s -> {
            SupplierDetailDto dto = new SupplierDetailDto();
            dto.setId(s.getId());
            dto.setName(s.getName());
            dto.setTaxCode(s.getTaxCode());
            dto.setPhone(s.getPhone());
            dto.setEmail(s.getEmail());
            dto.setAddress(s.getAddress());
            dto.setIsActive(s.getIsActive());
            dto.setBatchCount(batchRepository.findBySupplierId(s.getId()).size());
            return dto;
        }).collect(Collectors.toList());
    }

    public SupplierDetailDto saveSupplier(SaveSupplierRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên nhà cung cấp không được để trống");
        }

        Supplier s;
        if (req.getId() != null) {
            s = supplierRepository.findById(req.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + req.getId()));
        } else {
            s = new Supplier();
        }

        s.setName(req.getName().trim());
        s.setTaxCode(req.getTaxCode());
        s.setPhone(req.getPhone());
        s.setEmail(req.getEmail());
        s.setAddress(req.getAddress());
        s.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        Supplier saved = supplierRepository.save(s);
        SupplierDetailDto dto = new SupplierDetailDto();
        dto.setId(saved.getId());
        dto.setName(saved.getName());
        dto.setTaxCode(saved.getTaxCode());
        dto.setPhone(saved.getPhone());
        dto.setEmail(saved.getEmail());
        dto.setAddress(saved.getAddress());
        dto.setIsActive(saved.getIsActive());
        dto.setBatchCount(batchRepository.findBySupplierId(saved.getId()).size());
        return dto;
    }

    // =========================================================================
    // UC-DT10: XEM LỊCH SỬ NHẬP – XUẤT THUỐC (DƯỢC SĨ, QUẢN LÝ)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<StockTransactionDto> getStockTransactions(String type, LocalDate fromDate, LocalDate toDate) {
        List<StockTransaction> list;
        if (fromDate != null && toDate != null) {
            LocalDateTime start = fromDate.atStartOfDay();
            LocalDateTime end = toDate.atTime(23, 59, 59);
            list = transactionRepository.findByTransactionDateBetweenOrderByTransactionDateDesc(start, end);
        } else if (type != null && !type.trim().isEmpty()) {
            list = transactionRepository.findByTransactionTypeOrderByTransactionDateDesc(type.trim().toUpperCase());
        } else {
            list = transactionRepository.findAllByOrderByTransactionDateDesc();
        }

        if (type != null && !type.trim().isEmpty() && fromDate != null) {
            String filterType = type.trim().toUpperCase();
            list = list.stream().filter(tx -> filterType.equalsIgnoreCase(tx.getTransactionType())).collect(Collectors.toList());
        }

        return list.stream().map(tx -> {
            StockTransactionDto dto = new StockTransactionDto();
            dto.setId(tx.getId());
            dto.setBatchId(tx.getBatchId());
            dto.setTransactionType(tx.getTransactionType());
            dto.setQuantity(tx.getQuantity());
            dto.setReason(tx.getReason());
            dto.setTransactionDate(tx.getTransactionDate());
            dto.setPharmacistId(tx.getPharmacistId());
            dto.setPharmacistName(getPharmacistDisplayName(tx.getPharmacistId()));

            batchRepository.findById(tx.getBatchId()).ifPresent(b -> {
                dto.setBatchNumber(b.getBatchNumber());
                dto.setMedicineId(b.getMedicineId());
                medicineRepository.findById(b.getMedicineId()).ifPresent(m -> {
                    dto.setBrandName(m.getBrandName());
                    dto.setMedicineCode(m.getCode());
                    dto.setUnit(m.getUnit());
                });
            });
            return dto;
        }).collect(Collectors.toList());
    }

    // =========================================================================
    // HELPER MAPPERS & GENERATORS
    // =========================================================================
    public Long resolvePharmacistStaffId(Long idOrUserId) {
        if (idOrUserId == null) {
            return staffRepository.findByStaffCode("DS001").map(Staff::getId).orElse(6L);
        }
        // 1. Nếu là userId của nhân viên trong bảng staff (ví dụ: currentUser.id = 7 -> staff DS001 Phạm Thị Nga)
        Optional<Staff> byUser = staffRepository.findByUserId(idOrUserId);
        if (byUser.isPresent()) {
            return byUser.get().getId();
        }
        // 2. Nếu là staffId hợp lệ trực tiếp
        Optional<Staff> byId = staffRepository.findById(idOrUserId);
        if (byId.isPresent()) {
            return byId.get().getId();
        }
        return staffRepository.findByStaffCode("DS001").map(Staff::getId).orElse(6L);
    }

    public String getPharmacistDisplayName(Long pharmacistOrUserId) {
        if (pharmacistOrUserId == null) return "DS. Phạm Thị Nga";

        // 1. Kiểm tra theo userId trước (ví dụ: id 7 là user_id của DS001 Phạm Thị Nga)
        Optional<Staff> byUser = staffRepository.findByUserId(pharmacistOrUserId);
        if (byUser.isPresent()) {
            Staff s = byUser.get();
            if (s.getStaffCode() != null && s.getStaffCode().toUpperCase().startsWith("DS")) {
                return s.getFullName();
            }
        }

        // 2. Kiểm tra theo staffId trực tiếp
        Optional<Staff> byId = staffRepository.findById(pharmacistOrUserId);
        if (byId.isPresent()) {
            Staff s = byId.get();
            if (s.getStaffCode() != null && s.getStaffCode().toUpperCase().startsWith("DS")) {
                return s.getFullName();
            }
            // Nếu staffId không phải DS nhưng byUser tìm thấy DS thì ưu tiên DS
            if (byUser.isPresent() && byUser.get().getStaffCode() != null && byUser.get().getStaffCode().toUpperCase().startsWith("DS")) {
                return byUser.get().getFullName();
            }
            return s.getFullName();
        }

        if (byUser.isPresent()) {
            return byUser.get().getFullName();
        }

        return "DS. Phạm Thị Nga";
    }
    private PrescriptionResponse mapToPrescriptionResponse(Prescription p, List<PrescriptionItem> items, BigDecimal total) {
        PrescriptionResponse resp = new PrescriptionResponse();
        resp.setId(p.getId());
        resp.setPrescriptionCode(p.getPrescriptionCode());
        resp.setMedicalRecordId(p.getMedicalRecordId());
        resp.setDoctorId(p.getDoctorId());
        staffRepository.findById(p.getDoctorId()).ifPresent(s -> resp.setDoctorName(s.getFullName()));
        resp.setPatientId(p.getPatientId());
        patientRepository.findById(p.getPatientId()).ifPresent(pat -> {
            resp.setPatientName(pat.getFullName());
            resp.setPatientCode(pat.getPatientCode());
            resp.setPatientPhone(pat.getPhone());
        });
        resp.setDiagnosis(p.getDiagnosis());
        resp.setUsageNote(p.getUsageNote());
        resp.setStatus(p.getStatus());
        resp.setCreatedAt(p.getCreatedAt());
        resp.setTotalAmount(total);

        List<PrescriptionItemResponse> itemResponses = items.stream()
                .map(this::mapToPrescriptionItemResponse)
                .collect(Collectors.toList());
        resp.setItems(itemResponses);
        return resp;
    }

    private PrescriptionItemResponse mapToPrescriptionItemResponse(PrescriptionItem it) {
        PrescriptionItemResponse r = new PrescriptionItemResponse();
        r.setId(it.getId());
        r.setMedicineId(it.getMedicineId());
        r.setQuantity(it.getQuantity());
        r.setMorningDose(it.getMorningDose());
        r.setNoonDose(it.getNoonDose());
        r.setAfternoonDose(it.getAfternoonDose());
        r.setNightDose(it.getNightDose());
        r.setInstructions(it.getInstructions());
        r.setUnitPrice(it.getUnitPrice());
        r.setTotalAmount(it.getTotalAmount());

        medicineRepository.findById(it.getMedicineId()).ifPresent(m -> {
            r.setMedicineCode(m.getCode());
            r.setBrandName(m.getBrandName());
            r.setActiveIngredient(m.getActiveIngredient());
            r.setDosageForm(m.getDosageForm());
            r.setUnit(m.getUnit());
        });
        return r;
    }

    private MedicineDetailDto mapToMedicineDetailDto(Medicine m) {
        MedicineDetailDto dto = new MedicineDetailDto();
        dto.setId(m.getId());
        dto.setCategoryId(m.getCategoryId());
        categoryRepository.findById(m.getCategoryId()).ifPresent(c -> dto.setCategoryName(c.getName()));
        dto.setCode(m.getCode());
        dto.setBrandName(m.getBrandName());
        dto.setActiveIngredient(m.getActiveIngredient());
        dto.setDosageForm(m.getDosageForm());
        dto.setUnit(m.getUnit());
        dto.setUsageInstructions(m.getUsageInstructions());
        dto.setSellingPrice(m.getSellingPrice());
        dto.setIsPrescriptionRequired(m.getIsPrescriptionRequired());
        dto.setContraindications(m.getContraindications());
        dto.setIsActive(m.getIsActive());
        return dto;
    }

    private BatchDetailDto mapToBatchDetailDto(MedicineBatch b) {
        BatchDetailDto dto = new BatchDetailDto();
        dto.setId(b.getId());
        dto.setMedicineId(b.getMedicineId());
        medicineRepository.findById(b.getMedicineId()).ifPresent(m -> {
            dto.setBrandName(m.getBrandName());
            dto.setMedicineCode(m.getCode());
            dto.setActiveIngredient(m.getActiveIngredient());
            dto.setUnit(m.getUnit());
        });
        dto.setSupplierId(b.getSupplierId());
        if (b.getSupplierId() != null) {
            supplierRepository.findById(b.getSupplierId()).ifPresent(s -> dto.setSupplierName(s.getName()));
        }
        dto.setBatchNumber(b.getBatchNumber());
        dto.setManufactureDate(b.getManufactureDate());
        dto.setExpiryDate(b.getExpiryDate());
        dto.setImportPrice(b.getImportPrice());
        dto.setQuantityImported(b.getQuantityImported());
        dto.setQuantityAvailable(b.getQuantityAvailable());
        dto.setCreatedAt(b.getCreatedAt());

        LocalDate today = LocalDate.now();
        dto.setExpired(b.getExpiryDate().isBefore(today));
        dto.setDaysUntilExpiry(ChronoUnit.DAYS.between(today, b.getExpiryDate()));
        return dto;
    }

    private String generatePrescriptionCode() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = (int) (Math.random() * 9000 + 1000);
        return "DT" + date + rand;
    }

    private String generateDispensationCode() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = (int) (Math.random() * 9000 + 1000);
        return "CP" + date + rand;
    }

    private String generateMedicineCode() {
        return "MED_" + System.currentTimeMillis() % 100000;
    }

    private String generateBatchNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        int rand = (int) (Math.random() * 900 + 100);
        return "LO" + rand + "-" + year;
    }
}
