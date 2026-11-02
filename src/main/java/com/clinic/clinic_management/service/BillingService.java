package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.BillingDtos.*;
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
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final StaffRepository staffRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final LabOrderRepository labOrderRepository;
    private final LabResultRepository labResultRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;

    public BillingService(
            InvoiceRepository invoiceRepository,
            InvoiceItemRepository invoiceItemRepository,
            PaymentRepository paymentRepository,
            MedicalRecordRepository medicalRecordRepository,
            PatientRepository patientRepository,
            StaffRepository staffRepository,
            DoctorProfileRepository doctorProfileRepository,
            PrescriptionRepository prescriptionRepository,
            PrescriptionItemRepository prescriptionItemRepository,
            LabOrderRepository labOrderRepository,
            LabResultRepository labResultRepository,
            ClinicalServiceRepository clinicalServiceRepository,
            ServiceCategoryRepository serviceCategoryRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.paymentRepository = paymentRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionItemRepository = prescriptionItemRepository;
        this.labOrderRepository = labOrderRepository;
        this.labResultRepository = labResultRepository;
        this.clinicalServiceRepository = clinicalServiceRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
    }

    // =========================================================================
    // UC-TT01: LẬP HÓA ĐƠN TỪ PHIÊN KHÁM (DỊCH VỤ + THUỐC) (THU NGÂN)
    // =========================================================================
    public InvoiceDetailDto createInvoiceFromMedicalRecord(CreateInvoiceRequest req) {
        if (req.getMedicalRecordId() == null) {
            throw new IllegalArgumentException("Mã hồ sơ phiên khám không được để trống khi lập hóa đơn");
        }

        MedicalRecord record = medicalRecordRepository.findById(req.getMedicalRecordId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên khám ID: " + req.getMedicalRecordId()));

        Patient patient = patientRepository.findById(record.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bệnh nhân ID: " + record.getPatientId()));

        Long cashierStaffId = resolveCashierStaffId(req.getCashierId());

        // Kiểm tra xem phiên khám này đã có hóa đơn chưa
        Optional<Invoice> existingOpt = invoiceRepository.findFirstByMedicalRecordIdOrderByCreatedAtDesc(record.getId());
        Invoice invoice;
        if (existingOpt.isPresent() && "UNPAID".equalsIgnoreCase(existingOpt.get().getStatus())) {
            // Cập nhật lại hóa đơn chưa thanh toán
            invoice = existingOpt.get();
            invoiceItemRepository.deleteByInvoiceId(invoice.getId());
        } else {
            invoice = new Invoice();
            invoice.setInvoiceCode(generateInvoiceCode());
            invoice.setPatientId(patient.getId());
            invoice.setCashierId(cashierStaffId);
            invoice.setAppointmentId(record.getAppointmentId());
            invoice.setMedicalRecordId(record.getId());
            invoice.setStatus("UNPAID");
            invoice.setCreatedAt(LocalDateTime.now());
        }

        invoice.setNote(req.getNote() != null ? req.getNote().trim() : "Hóa đơn viện phí phiên khám " + record.getRecordCode());
        Invoice savedInvoice = invoiceRepository.save(invoice);

        List<InvoiceItem> itemsToSave = new ArrayList<>();
        BigDecimal totalService = BigDecimal.ZERO;
        BigDecimal totalMedicine = BigDecimal.ZERO;

        // 1. Khoản mục tiền khám bác sĩ
        BigDecimal consultationFee = BigDecimal.valueOf(200000); // Mặc định 200,000 VND
        if (record.getDoctorId() != null) {
            Optional<DoctorProfile> docProfile = doctorProfileRepository.findById(record.getDoctorId());
            if (docProfile.isPresent() && docProfile.get().getConsultationFee() != null) {
                consultationFee = docProfile.get().getConsultationFee();
            }
        }
        InvoiceItem docItem = new InvoiceItem();
        docItem.setInvoiceId(savedInvoice.getId());
        docItem.setItemType("CONSULTATION_FEE");
        docItem.setReferenceId(record.getDoctorId());
        String docName = staffRepository.findById(record.getDoctorId()).map(Staff::getFullName).orElse("Bác sĩ chuyên khoa");
        docItem.setItemName("Khám lâm sàng chuyên khoa (" + docName + ")");
        docItem.setUnitPrice(consultationFee);
        docItem.setQuantity(1);
        docItem.setSubtotal(consultationFee);
        itemsToSave.add(docItem);
        totalService = totalService.add(consultationFee);

        // 2. Khoản mục tiền dịch vụ Cận lâm sàng (xét nghiệm, chẩn đoán hình ảnh)
        List<LabOrder> labOrders = labOrderRepository.findByMedicalRecordId(record.getId());
        for (LabOrder lo : labOrders) {
            List<LabResult> results = labResultRepository.findByLabOrderId(lo.getId());
            for (LabResult lr : results) {
                ClinicalService cs = clinicalServiceRepository.findById(lr.getServiceId()).orElse(null);
                String srvName = cs != null ? cs.getName() : "Dịch vụ cận lâm sàng ID " + lr.getServiceId();
                BigDecimal srvPrice = cs != null ? cs.getPrice() : BigDecimal.valueOf(150000);

                InvoiceItem labItem = new InvoiceItem();
                labItem.setInvoiceId(savedInvoice.getId());
                labItem.setItemType("LAB_SERVICE");
                labItem.setReferenceId(lr.getServiceId());
                labItem.setItemName(srvName);
                labItem.setUnitPrice(srvPrice);
                labItem.setQuantity(1);
                labItem.setSubtotal(srvPrice);
                itemsToSave.add(labItem);
                totalService = totalService.add(srvPrice);
            }
        }

        // 3. Khoản mục tiền thuốc (Đơn thuốc bác sĩ kê)
        List<Prescription> prescriptions = prescriptionRepository.findByMedicalRecordId(record.getId());
        for (Prescription p : prescriptions) {
            List<PrescriptionItem> pItems = prescriptionItemRepository.findByPrescriptionId(p.getId());
            for (PrescriptionItem pi : pItems) {
                InvoiceItem medItem = new InvoiceItem();
                medItem.setInvoiceId(savedInvoice.getId());
                medItem.setItemType("MEDICINE");
                medItem.setReferenceId(pi.getMedicineId());
                medItem.setItemName("Thuốc: " + (pi.getInstructions() != null && !pi.getInstructions().isEmpty() ? pi.getInstructions() : "Đơn thuốc"));
                medItem.setUnitPrice(pi.getUnitPrice());
                medItem.setQuantity(pi.getQuantity());
                medItem.setSubtotal(pi.getTotalAmount());
                itemsToSave.add(medItem);
                totalMedicine = totalMedicine.add(pi.getTotalAmount());
            }
        }

        invoiceItemRepository.saveAll(itemsToSave);

        // UC-TT02: Tính toán BHYT & Giảm giá
        BigDecimal discount = req.getDiscountAmount() != null && req.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0
                ? req.getDiscountAmount() : BigDecimal.ZERO;

        BigDecimal insurancePaid = BigDecimal.ZERO;
        if (req.getInsurancePaidAmount() != null && req.getInsurancePaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            insurancePaid = req.getInsurancePaidAmount();
        } else if (req.getInsuranceRate() != null && req.getInsuranceRate().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal rate = req.getInsuranceRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            insurancePaid = totalService.add(totalMedicine).multiply(rate).setScale(0, RoundingMode.HALF_UP);
        } else if (patient.getHealthInsuranceNumber() != null && !patient.getHealthInsuranceNumber().trim().isEmpty()) {
            // Mặc định hưởng 80% nếu có BHYT
            insurancePaid = totalService.multiply(BigDecimal.valueOf(0.8)).setScale(0, RoundingMode.HALF_UP);
        }

        BigDecimal subtotal = totalService.add(totalMedicine);
        BigDecimal finalAmount = subtotal.subtract(insurancePaid).subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        savedInvoice.setTotalServiceAmount(totalService);
        savedInvoice.setTotalMedicineAmount(totalMedicine);
        savedInvoice.setInsurancePaidAmount(insurancePaid);
        savedInvoice.setDiscountAmount(discount);
        savedInvoice.setFinalAmount(finalAmount);

        Invoice finalSaved = invoiceRepository.save(savedInvoice);
        return mapToInvoiceDetailDto(finalSaved);
    }

    // =========================================================================
    // UC-TT02: ÁP DỤNG BẢO HIỂM Y TẾ / GIẢM GIÁ (THU NGÂN)
    // =========================================================================
    public InvoiceDetailDto applyInsuranceAndDiscount(Long invoiceId, ApplyInsuranceDiscountRequest req) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn ID: " + invoiceId));

        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new IllegalStateException("Hóa đơn đã được thanh toán, không thể thay đổi mức bảo hiểm hoặc giảm giá");
        }

        BigDecimal subtotal = invoice.getTotalServiceAmount().add(invoice.getTotalMedicineAmount());
        BigDecimal insurancePaid = BigDecimal.ZERO;

        if (req.getInsurancePaidAmount() != null && req.getInsurancePaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            insurancePaid = req.getInsurancePaidAmount();
        } else if (req.getInsuranceRate() != null && req.getInsuranceRate().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal rate = req.getInsuranceRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            insurancePaid = subtotal.multiply(rate).setScale(0, RoundingMode.HALF_UP);
        }

        BigDecimal discount = req.getDiscountAmount() != null && req.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0
                ? req.getDiscountAmount() : BigDecimal.ZERO;

        BigDecimal finalAmount = subtotal.subtract(insurancePaid).subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        invoice.setInsurancePaidAmount(insurancePaid);
        invoice.setDiscountAmount(discount);
        invoice.setFinalAmount(finalAmount);

        if (req.getDiscountReason() != null && !req.getDiscountReason().trim().isEmpty()) {
            invoice.setNote((invoice.getNote() != null ? invoice.getNote() + " | " : "") + "Khấu trừ: " + req.getDiscountReason().trim());
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToInvoiceDetailDto(saved);
    }

    // =========================================================================
    // UC-TT03: THU TIỀN (TIỀN MẶT, THẺ, VÍ ĐIỆN TỬ, CHUYỂN KHOẢN) (THU NGÂN)
    // =========================================================================
    public PaymentResponseDto processPayment(ProcessPaymentRequest req) {
        if (req.getInvoiceId() == null) {
            throw new IllegalArgumentException("Mã hóa đơn không được để trống khi thanh toán");
        }

        Invoice invoice = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn ID: " + req.getInvoiceId()));

        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new IllegalStateException("Hóa đơn này đã hoàn tất thanh toán trước đó");
        }
        if ("CANCELLED".equalsIgnoreCase(invoice.getStatus()) || "REFUNDED".equalsIgnoreCase(invoice.getStatus())) {
            throw new IllegalStateException("Hóa đơn đang ở trạng thái " + invoice.getStatus() + ", không thể thu tiền");
        }

        BigDecimal paidAmount = req.getAmount() != null ? req.getAmount() : invoice.getFinalAmount();
        if (paidAmount.compareTo(invoice.getFinalAmount()) < 0) {
            throw new IllegalArgumentException("Số tiền thanh toán (" + formatCurrency(paidAmount)
                    + ") không đủ cho tổng hóa đơn (" + formatCurrency(invoice.getFinalAmount()) + ")");
        }

        Long cashierStaffId = resolveCashierStaffId(req.getCashierId());

        Payment payment = new Payment();
        payment.setPaymentCode(generatePaymentCode());
        payment.setInvoiceId(invoice.getId());
        payment.setCashierId(cashierStaffId);
        payment.setAmount(paidAmount);
        payment.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod().toUpperCase() : "CASH");
        payment.setTransactionReference(req.getTransactionReference());
        payment.setStatus("SUCCESS");
        payment.setPaymentTime(LocalDateTime.now());
        payment.setNote(req.getNote());
        Payment savedPayment = paymentRepository.save(payment);

        // Cập nhật trạng thái hóa đơn sang PAID
        invoice.setStatus("PAID");
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setCashierId(cashierStaffId);
        invoiceRepository.save(invoice);

        // Đồng bộ cập nhật đơn thuốc của phiên khám sang PAID để dược sĩ cấp phát
        if (invoice.getMedicalRecordId() != null) {
            List<Prescription> prescriptions = prescriptionRepository.findByMedicalRecordId(invoice.getMedicalRecordId());
            for (Prescription p : prescriptions) {
                if ("PENDING_PAYMENT".equalsIgnoreCase(p.getStatus())) {
                    p.setStatus("PAID");
                    prescriptionRepository.save(p);
                }
            }

            // Đồng bộ cập nhật phiếu cận lâm sàng sang PAID
            List<LabOrder> labOrders = labOrderRepository.findByMedicalRecordId(invoice.getMedicalRecordId());
            for (LabOrder lo : labOrders) {
                if ("PENDING".equalsIgnoreCase(lo.getStatus())) {
                    lo.setStatus("PAID");
                    labOrderRepository.save(lo);
                }
            }
        }

        BigDecimal changeAmount = BigDecimal.ZERO;
        if (req.getCustomerGivenAmount() != null && req.getCustomerGivenAmount().compareTo(paidAmount) > 0) {
            changeAmount = req.getCustomerGivenAmount().subtract(paidAmount);
        }

        PaymentResponseDto resp = new PaymentResponseDto();
        resp.setSuccess(true);
        resp.setMessage("Thanh toán hóa đơn viện phí thành công");
        resp.setPaymentCode(savedPayment.getPaymentCode());
        resp.setInvoiceCode(invoice.getInvoiceCode());
        resp.setAmountPaid(paidAmount);
        resp.setChangeAmount(changeAmount);
        resp.setPaymentMethod(savedPayment.getPaymentMethod());
        resp.setPaymentTime(savedPayment.getPaymentTime());
        return resp;
    }

    // =========================================================================
    // UC-TT04: IN / GỬI HÓA ĐƠN (THU NGÂN)
    // =========================================================================
    @Transactional(readOnly = true)
    public InvoicePrintDto getInvoicePrintData(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn ID: " + invoiceId));

        Patient patient = patientRepository.findById(invoice.getPatientId()).orElse(null);
        MedicalRecord record = invoice.getMedicalRecordId() != null
                ? medicalRecordRepository.findById(invoice.getMedicalRecordId()).orElse(null) : null;

        InvoicePrintDto dto = new InvoicePrintDto();
        dto.setInvoiceCode(invoice.getInvoiceCode());
        dto.setPrintDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy")));

        if (patient != null) {
            dto.setPatientName(patient.getFullName());
            dto.setPatientCode(patient.getPatientCode());
            dto.setPatientGender(patient.getGender() != null ? ("FEMALE".equalsIgnoreCase(patient.getGender()) ? "Nữ" : "Nam") : "---");
            if (patient.getDateOfBirth() != null) {
                dto.setPatientAge(LocalDate.now().getYear() - patient.getDateOfBirth().getYear());
            }
            dto.setPatientPhone(patient.getPhone());
            dto.setPatientAddress(patient.getAddress());
            dto.setHealthInsuranceNumber(patient.getHealthInsuranceNumber());
        }

        if (record != null) {
            dto.setDiagnosis(record.getFinalDiagnosis() != null ? record.getFinalDiagnosis() : record.getInitialDiagnosis());
            if (record.getDoctorId() != null) {
                staffRepository.findById(record.getDoctorId()).ifPresent(d -> dto.setDoctorName(d.getFullName()));
            }
        }

        if (invoice.getCashierId() != null) {
            staffRepository.findById(invoice.getCashierId()).ifPresent(c -> dto.setCashierName(c.getFullName()));
        } else {
            dto.setCashierName("Thu ngân CarePlus");
        }

        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceId(invoice.getId());
        List<InvoiceItemDto> itemDtos = items.stream().map(this::mapToInvoiceItemDto).collect(Collectors.toList());
        dto.setItems(itemDtos);

        dto.setTotalServiceAmount(invoice.getTotalServiceAmount());
        dto.setTotalMedicineAmount(invoice.getTotalMedicineAmount());
        dto.setDiscountAmount(invoice.getDiscountAmount());
        dto.setInsurancePaidAmount(invoice.getInsurancePaidAmount());
        dto.setFinalAmount(invoice.getFinalAmount());
        dto.setAmountInWords(convertNumberToWords(invoice.getFinalAmount()));
        dto.setPaymentStatus("PAID".equalsIgnoreCase(invoice.getStatus()) ? "Đã thanh toán" : "Chưa thanh toán");

        List<Payment> payments = paymentRepository.findByInvoiceIdOrderByPaymentTimeDesc(invoice.getId());
        if (!payments.isEmpty()) {
            dto.setPaymentMethod(mapPaymentMethodDesc(payments.get(0).getPaymentMethod()));
        } else {
            dto.setPaymentMethod("Chờ thanh toán");
        }

        dto.setNote(invoice.getNote());
        return dto;
    }

    public boolean sendInvoiceEmail(Long invoiceId, String recipientEmail) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn ID: " + invoiceId));
        // Giả lập ghi nhận gửi hóa đơn điện tử thành công qua email bệnh nhân
        return true;
    }

    // =========================================================================
    // UC-TT05: HOÀN TIỀN / HỦY GIAO DỊCH (THU NGÂN, QUẢN LÝ)
    // =========================================================================
    public InvoiceDetailDto refundOrCancelInvoice(RefundInvoiceRequest req) {
        if (req.getInvoiceId() == null) {
            throw new IllegalArgumentException("Mã hóa đơn không được để trống khi hoàn tiền hoặc hủy");
        }
        if (req.getReason() == null || req.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Bắt buộc phải nhập lý do khi thực hiện hủy hoặc hoàn tiền viện phí");
        }

        Invoice invoice = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn ID: " + req.getInvoiceId()));

        String oldStatus = invoice.getStatus();
        if ("CANCELLED".equalsIgnoreCase(oldStatus) || "REFUNDED".equalsIgnoreCase(oldStatus)) {
            throw new IllegalStateException("Hóa đơn đã ở trạng thái " + oldStatus + ", không thể thao tác lại");
        }

        Long actorStaffId = resolveCashierStaffId(req.getActorId());
        String actorName = staffRepository.findById(actorStaffId).map(Staff::getFullName).orElse("Thu ngân");

        if ("PAID".equalsIgnoreCase(oldStatus)) {
            // Hoàn tiền cho hóa đơn đã thu
            invoice.setStatus("REFUNDED");
            invoice.setNote((invoice.getNote() != null ? invoice.getNote() + " | " : "")
                    + "Hoàn tiền bởi " + actorName + " lúc "
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                    + ". Lý do: " + req.getReason().trim());

            // Ghi nhận giao dịch hoàn tiền âm
            Payment refundTx = new Payment();
            refundTx.setPaymentCode(generatePaymentCode());
            refundTx.setInvoiceId(invoice.getId());
            refundTx.setCashierId(actorStaffId);
            refundTx.setAmount(invoice.getFinalAmount().negate());
            refundTx.setPaymentMethod("CASH");
            refundTx.setStatus("REFUNDED");
            refundTx.setPaymentTime(LocalDateTime.now());
            refundTx.setNote("Hoàn trả viện phí: " + req.getReason().trim());
            paymentRepository.save(refundTx);
        } else {
            // Hủy hóa đơn chưa thanh toán
            invoice.setStatus("CANCELLED");
            invoice.setNote((invoice.getNote() != null ? invoice.getNote() + " | " : "")
                    + "Hủy hóa đơn bởi " + actorName + ". Lý do: " + req.getReason().trim());
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToInvoiceDetailDto(saved);
    }

    // =========================================================================
    // UC-TT06: XEM LỊCH SỬ GIAO DỊCH & BÁO CÁO DOANH THU (THU NGÂN, QUẢN LÝ, BỆNH NHÂN)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<InvoiceDetailDto> getInvoices(String status, LocalDate fromDate, LocalDate toDate, String query) {
        List<Invoice> list;
        if (fromDate != null && toDate != null) {
            LocalDateTime start = fromDate.atStartOfDay();
            LocalDateTime end = toDate.atTime(23, 59, 59);
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                list = invoiceRepository.findByStatusAndCreatedAtBetween(status.trim().toUpperCase(), start, end);
            } else {
                list = invoiceRepository.findByCreatedAtBetween(start, end);
            }
        } else if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            list = invoiceRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        } else {
            list = invoiceRepository.findAllByOrderByCreatedAtDesc();
        }

        List<InvoiceDetailDto> dtoList = list.stream().map(this::mapToInvoiceDetailDto).collect(Collectors.toList());

        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            dtoList = dtoList.stream().filter(dto ->
                    (dto.getInvoiceCode() != null && dto.getInvoiceCode().toLowerCase().contains(q)) ||
                    (dto.getPatientName() != null && dto.getPatientName().toLowerCase().contains(q)) ||
                    (dto.getPatientCode() != null && dto.getPatientCode().toLowerCase().contains(q)) ||
                    (dto.getPatientPhone() != null && dto.getPatientPhone().contains(q))
            ).collect(Collectors.toList());
        }

        return dtoList;
    }

    @Transactional(readOnly = true)
    public InvoiceDetailDto getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn ID: " + id));
        return mapToInvoiceDetailDto(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceDetailDto> getInvoicesByPatient(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::mapToInvoiceDetailDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingStatsDto getBillingOverviewStats(LocalDate fromDate, LocalDate toDate) {
        LocalDate startD = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate endD = toDate != null ? toDate : LocalDate.now();

        LocalDateTime start = startD.atStartOfDay();
        LocalDateTime end = endD.atTime(23, 59, 59);

        List<Payment> payments = paymentRepository.findByPaymentTimeBetween(start, end);
        List<Invoice> invoices = invoiceRepository.findByCreatedAtBetween(start, end);

        BillingStatsDto stats = new BillingStatsDto();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCash = BigDecimal.ZERO;
        BigDecimal totalBank = BigDecimal.ZERO;
        BigDecimal totalCard = BigDecimal.ZERO;
        BigDecimal totalEWallet = BigDecimal.ZERO;
        BigDecimal totalRefunded = BigDecimal.ZERO;

        for (Payment p : payments) {
            if ("REFUNDED".equalsIgnoreCase(p.getStatus()) || p.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                totalRefunded = totalRefunded.add(p.getAmount().abs());
                continue;
            }
            if ("SUCCESS".equalsIgnoreCase(p.getStatus())) {
                totalRevenue = totalRevenue.add(p.getAmount());
                String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase() : "CASH";
                switch (method) {
                    case "CASH":
                        totalCash = totalCash.add(p.getAmount());
                        break;
                    case "BANK_TRANSFER":
                        totalBank = totalBank.add(p.getAmount());
                        break;
                    case "CREDIT_CARD":
                        totalCard = totalCard.add(p.getAmount());
                        break;
                    case "MOMO":
                    case "VNPAY_QR":
                        totalEWallet = totalEWallet.add(p.getAmount());
                        break;
                    default:
                        totalCash = totalCash.add(p.getAmount());
                        break;
                }
            }
        }

        long paidCount = invoices.stream().filter(i -> "PAID".equalsIgnoreCase(i.getStatus())).count();
        long unpaidCount = invoices.stream().filter(i -> "UNPAID".equalsIgnoreCase(i.getStatus())).count();
        long refundedCount = invoices.stream().filter(i -> "REFUNDED".equalsIgnoreCase(i.getStatus())).count();

        stats.setTotalRevenue(totalRevenue);
        stats.setTotalCash(totalCash);
        stats.setTotalBankTransfer(totalBank);
        stats.setTotalCard(totalCard);
        stats.setTotalEWallet(totalEWallet);
        stats.setTotalRefunded(totalRefunded);
        stats.setPaidInvoiceCount(paidCount);
        stats.setUnpaidInvoiceCount(unpaidCount);
        stats.setRefundedInvoiceCount(refundedCount);
        return stats;
    }

    // =========================================================================
    // UC-TT07: QUẢN LÝ BẢNG GIÁ DỊCH VỤ (QUẢN LÝ)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ServicePriceDto> getAllServices(String query, Long categoryId) {
        List<ClinicalService> list;
        if (categoryId != null && categoryId > 0) {
            list = clinicalServiceRepository.findByCategoryId(categoryId);
        } else {
            list = clinicalServiceRepository.findAllByOrderByIdAsc();
        }

        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            list = list.stream().filter(s ->
                    (s.getName() != null && s.getName().toLowerCase().contains(q)) ||
                    (s.getCode() != null && s.getCode().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        Map<Long, String> catMap = serviceCategoryRepository.findAll().stream()
                .collect(Collectors.toMap(ServiceCategory::getId, ServiceCategory::getName, (a, b) -> a));

        return list.stream().map(s -> {
            ServicePriceDto dto = new ServicePriceDto();
            dto.setId(s.getId());
            dto.setCategoryId(s.getCategoryId());
            dto.setCategoryName(catMap.getOrDefault(s.getCategoryId(), "Dịch vụ kỹ thuật"));
            dto.setCode(s.getCode());
            dto.setName(s.getName());
            dto.setPrice(s.getPrice());
            dto.setInsuranceCovered(s.getInsuranceCovered());
            dto.setEstimatedDurationMinutes(s.getEstimatedDurationMinutes());
            dto.setDescription(s.getDescription());
            dto.setIsActive(s.getIsActive());
            return dto;
        }).collect(Collectors.toList());
    }

    public ServicePriceDto saveServicePrice(SaveServicePriceRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên dịch vụ không được để trống");
        }
        if (req.getPrice() == null || req.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Đơn giá dịch vụ phải lớn hơn hoặc bằng 0");
        }

        ClinicalService entity;
        if (req.getId() != null) {
            entity = clinicalServiceRepository.findById(req.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ ID: " + req.getId()));
        } else {
            entity = new ClinicalService();
            if (req.getCode() == null || req.getCode().trim().isEmpty()) {
                entity.setCode("SRV_" + System.currentTimeMillis() % 100000);
            } else {
                entity.setCode(req.getCode().trim().toUpperCase());
            }
        }

        entity.setName(req.getName().trim());
        entity.setPrice(req.getPrice());
        entity.setCategoryId(req.getCategoryId() != null ? req.getCategoryId() : 1L);
        entity.setInsuranceCovered(req.getInsuranceCovered() != null ? req.getInsuranceCovered() : false);
        entity.setEstimatedDurationMinutes(req.getEstimatedDurationMinutes() != null ? req.getEstimatedDurationMinutes() : 15);
        entity.setDescription(req.getDescription());
        entity.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        ClinicalService saved = clinicalServiceRepository.save(entity);

        ServicePriceDto dto = new ServicePriceDto();
        dto.setId(saved.getId());
        dto.setCategoryId(saved.getCategoryId());
        serviceCategoryRepository.findById(saved.getCategoryId()).ifPresent(c -> dto.setCategoryName(c.getName()));
        dto.setCode(saved.getCode());
        dto.setName(saved.getName());
        dto.setPrice(saved.getPrice());
        dto.setInsuranceCovered(saved.getInsuranceCovered());
        dto.setEstimatedDurationMinutes(saved.getEstimatedDurationMinutes());
        dto.setDescription(saved.getDescription());
        dto.setIsActive(saved.getIsActive());
        return dto;
    }

    // =========================================================================
    // HELPER MAPPERS & UTILITIES
    // =========================================================================
    private InvoiceDetailDto mapToInvoiceDetailDto(Invoice inv) {
        InvoiceDetailDto dto = new InvoiceDetailDto();
        dto.setId(inv.getId());
        dto.setInvoiceCode(inv.getInvoiceCode());
        dto.setPatientId(inv.getPatientId());
        dto.setCashierId(inv.getCashierId());
        dto.setAppointmentId(inv.getAppointmentId());
        dto.setMedicalRecordId(inv.getMedicalRecordId());
        dto.setTotalServiceAmount(inv.getTotalServiceAmount());
        dto.setTotalMedicineAmount(inv.getTotalMedicineAmount());
        dto.setDiscountAmount(inv.getDiscountAmount());
        dto.setInsurancePaidAmount(inv.getInsurancePaidAmount());
        dto.setFinalAmount(inv.getFinalAmount());
        dto.setStatus(inv.getStatus());
        dto.setStatusDesc(mapStatusDesc(inv.getStatus()));
        dto.setNote(inv.getNote());
        dto.setCreatedAt(inv.getCreatedAt());
        dto.setPaidAt(inv.getPaidAt());

        patientRepository.findById(inv.getPatientId()).ifPresent(p -> {
            dto.setPatientName(p.getFullName());
            dto.setPatientCode(p.getPatientCode());
            dto.setPatientPhone(p.getPhone());
            dto.setHealthInsuranceNumber(p.getHealthInsuranceNumber());
        });

        if (inv.getMedicalRecordId() != null) {
            medicalRecordRepository.findById(inv.getMedicalRecordId()).ifPresent(rec -> {
                dto.setRecordCode(rec.getRecordCode());
                dto.setDiagnosis(rec.getFinalDiagnosis() != null ? rec.getFinalDiagnosis() : rec.getInitialDiagnosis());
                if (rec.getDoctorId() != null) {
                    staffRepository.findById(rec.getDoctorId()).ifPresent(d -> dto.setDoctorName(d.getFullName()));
                }
            });
        }

        if (inv.getCashierId() != null) {
            staffRepository.findById(inv.getCashierId()).ifPresent(c -> dto.setCashierName(c.getFullName()));
        }

        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceId(inv.getId());
        dto.setItems(items.stream().map(this::mapToInvoiceItemDto).collect(Collectors.toList()));

        List<Payment> payments = paymentRepository.findByInvoiceIdOrderByPaymentTimeDesc(inv.getId());
        dto.setPayments(payments.stream().map(this::mapToPaymentDto).collect(Collectors.toList()));

        return dto;
    }

    private InvoiceItemDto mapToInvoiceItemDto(InvoiceItem it) {
        InvoiceItemDto dto = new InvoiceItemDto();
        dto.setId(it.getId());
        dto.setInvoiceId(it.getInvoiceId());
        dto.setItemType(it.getItemType());
        dto.setItemTypeDesc(mapItemTypeDesc(it.getItemType()));
        dto.setReferenceId(it.getReferenceId());
        dto.setItemName(it.getItemName());
        dto.setUnitPrice(it.getUnitPrice());
        dto.setQuantity(it.getQuantity());
        dto.setSubtotal(it.getSubtotal());
        return dto;
    }

    private PaymentDto mapToPaymentDto(Payment p) {
        PaymentDto dto = new PaymentDto();
        dto.setId(p.getId());
        dto.setPaymentCode(p.getPaymentCode());
        dto.setInvoiceId(p.getInvoiceId());
        dto.setCashierId(p.getCashierId());
        staffRepository.findById(p.getCashierId()).ifPresent(s -> dto.setCashierName(s.getFullName()));
        dto.setAmount(p.getAmount());
        dto.setPaymentMethod(p.getPaymentMethod());
        dto.setPaymentMethodDesc(mapPaymentMethodDesc(p.getPaymentMethod()));
        dto.setTransactionReference(p.getTransactionReference());
        dto.setStatus(p.getStatus());
        dto.setPaymentTime(p.getPaymentTime());
        dto.setNote(p.getNote());
        return dto;
    }

    private String mapStatusDesc(String status) {
        if (status == null) return "Chờ thanh toán";
        switch (status.toUpperCase()) {
            case "PAID": return "Đã thanh toán";
            case "UNPAID": return "Chưa thanh toán";
            case "REFUNDED": return "Đã hoàn tiền";
            case "CANCELLED": return "Đã hủy";
            default: return status;
        }
    }

    private String mapItemTypeDesc(String itemType) {
        if (itemType == null) return "Dịch vụ khác";
        switch (itemType.toUpperCase()) {
            case "CONSULTATION_FEE": return "Khám chuyên khoa";
            case "LAB_SERVICE": return "Cận lâm sàng & Xét nghiệm";
            case "MEDICINE": return "Thuốc điều trị";
            default: return "Khoản mục khác";
        }
    }

    private String mapPaymentMethodDesc(String method) {
        if (method == null) return "Tiền mặt";
        switch (method.toUpperCase()) {
            case "CASH": return "Tiền mặt";
            case "CREDIT_CARD": return "Thẻ ngân hàng (POS)";
            case "BANK_TRANSFER": return "Chuyển khoản ngân hàng";
            case "MOMO": return "Ví điện tử MoMo";
            case "VNPAY_QR": return "Quét mã VNPAY-QR";
            default: return method;
        }
    }

    private Long resolveCashierStaffId(Long idOrUserId) {
        if (idOrUserId == null) {
            return staffRepository.findByStaffCode("TN001").map(Staff::getId).orElse(7L);
        }
        Optional<Staff> byUser = staffRepository.findByUserId(idOrUserId);
        if (byUser.isPresent()) {
            return byUser.get().getId();
        }
        Optional<Staff> byId = staffRepository.findById(idOrUserId);
        if (byId.isPresent()) {
            return byId.get().getId();
        }
        return staffRepository.findByStaffCode("TN001").map(Staff::getId).orElse(7L);
    }

    private synchronized String generateInvoiceCode() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = 1000 + new Random().nextInt(9000);
        return "HD" + dateStr + rand;
    }

    private synchronized String generatePaymentCode() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = 1000 + new Random().nextInt(9000);
        return "TT" + dateStr + rand;
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0 đ";
        return String.format("%,.0f đ", amount);
    }

    // Đọc số tiền thành chữ tiếng Việt chuẩn xác
    public static String convertNumberToWords(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) return "Không đồng chẵn";
        long number = amount.setScale(0, RoundingMode.HALF_UP).longValue();
        if (number == 0) return "Không đồng chẵn";

        String[] units = {"", "nghìn", "triệu", "tỷ", "nghìn tỷ"};
        String res = "";
        int unitIndex = 0;

        while (number > 0) {
            int block = (int) (number % 1000);
            if (block > 0) {
                String blockText = readThreeDigits(block);
                res = blockText + " " + units[unitIndex] + " " + res;
            }
            number /= 1000;
            unitIndex++;
        }

        res = res.trim().replaceAll("\\s+", " ");
        res = Character.toUpperCase(res.charAt(0)) + res.substring(1) + " đồng chẵn";
        return res;
    }

    private static String readThreeDigits(int n) {
        String[] digits = {"không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"};
        int hundred = n / 100;
        int ten = (n % 100) / 10;
        int one = n % 10;
        StringBuilder sb = new StringBuilder();

        if (hundred > 0) {
            sb.append(digits[hundred]).append(" trăm ");
        }
        if (ten > 1) {
            sb.append(digits[ten]).append(" mươi ");
            if (one == 1) sb.append("mốt ");
            else if (one == 5) sb.append("lăm ");
            else if (one > 0) sb.append(digits[one]).append(" ");
        } else if (ten == 1) {
            sb.append("mười ");
            if (one == 5) sb.append("lăm ");
            else if (one > 0) sb.append(digits[one]).append(" ");
        } else if (hundred > 0 && one > 0) {
            sb.append("lẻ ").append(digits[one]).append(" ");
        } else if (one > 0) {
            sb.append(digits[one]).append(" ");
        }

        return sb.toString().trim();
    }

    @Transactional(readOnly = true)
    public List<MedicalCandidateDto> getCandidates() {
        List<MedicalRecord> records = medicalRecordRepository.findAll();
        records.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        List<MedicalCandidateDto> res = new java.util.ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

        for (MedicalRecord rec : records) {
            MedicalCandidateDto dto = new MedicalCandidateDto();
            dto.setMedicalRecordId(rec.getId());
            dto.setRecordCode(rec.getRecordCode());
            dto.setPatientId(rec.getPatientId());
            dto.setDiagnosis(rec.getFinalDiagnosis() != null ? rec.getFinalDiagnosis() : rec.getInitialDiagnosis());
            if (rec.getUpdatedAt() != null) {
                dto.setCompletedAt(rec.getUpdatedAt().format(dtf));
            } else if (rec.getCreatedAt() != null) {
                dto.setCompletedAt(rec.getCreatedAt().format(dtf));
            }

            patientRepository.findById(rec.getPatientId()).ifPresent(p -> {
                dto.setPatientCode(p.getPatientCode());
                dto.setPatientName(p.getFullName());
                dto.setPatientPhone(p.getPhone());
            });

            if (rec.getDoctorId() != null) {
                staffRepository.findById(rec.getDoctorId()).ifPresent(d -> dto.setDoctorName(d.getFullName()));
            }

            Optional<Invoice> existingInv = invoiceRepository.findFirstByMedicalRecordIdOrderByCreatedAtDesc(rec.getId());
            if (existingInv.isPresent()) {
                dto.setInvoiceCreated(true);
                dto.setInvoiceId(existingInv.get().getId());
                dto.setInvoiceCode(existingInv.get().getInvoiceCode());
            } else {
                dto.setInvoiceCreated(false);
            }

            res.add(dto);
        }
        return res;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getAllPayments() {
        List<Payment> list = paymentRepository.findAllByOrderByPaymentTimeDesc();
        return list.stream().map(p -> {
            PaymentDto dto = new PaymentDto();
            dto.setId(p.getId());
            dto.setPaymentCode(p.getPaymentCode());
            dto.setInvoiceId(p.getInvoiceId());
            dto.setCashierId(p.getCashierId());
            dto.setAmount(p.getAmount());
            dto.setPaymentMethod(p.getPaymentMethod());
            dto.setPaymentMethodLabel(mapPaymentMethodDesc(p.getPaymentMethod()));
            dto.setTransactionReference(p.getTransactionReference());
            dto.setStatus(p.getStatus());
            dto.setPaymentTime(p.getPaymentTime());
            dto.setNote(p.getNote());

            staffRepository.findById(p.getCashierId()).ifPresent(c -> dto.setCashierName(c.getFullName()));
            invoiceRepository.findById(p.getInvoiceId()).ifPresent(inv -> {
                dto.setInvoiceCode(inv.getInvoiceCode());
                patientRepository.findById(inv.getPatientId()).ifPresent(pt -> dto.setPatientName(pt.getFullName()));
            });
            return dto;
        }).collect(Collectors.toList());
    }
}
