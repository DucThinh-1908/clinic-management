package com.clinic.clinic_management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class BillingDtos {

    // =========================================================================
    // KHOẢN MỤC HÓA ĐƠN
    // =========================================================================
    public static class InvoiceItemDto {
        private Long id;
        private Long invoiceId;
        private String itemType; // CONSULTATION_FEE, LAB_SERVICE, MEDICINE, OTHER
        private String itemTypeDesc;
        private Long referenceId;
        private String itemName;
        private BigDecimal unitPrice = BigDecimal.ZERO;
        private Integer quantity = 1;
        private BigDecimal subtotal = BigDecimal.ZERO;

        public InvoiceItemDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getInvoiceId() { return invoiceId; }
        public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
        public String getItemType() { return itemType; }
        public void setItemType(String itemType) { this.itemType = itemType; }
        public String getItemTypeDesc() { return itemTypeDesc; }
        public void setItemTypeDesc(String itemTypeDesc) { this.itemTypeDesc = itemTypeDesc; }
        public Long getReferenceId() { return referenceId; }
        public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    }

    // =========================================================================
    // GIAO DỊCH THANH TOÁN
    // =========================================================================
    public static class PaymentDto {
        private Long id;
        private String paymentCode;
        private Long invoiceId;
        private Long cashierId;
        private String cashierName;
        private BigDecimal amount = BigDecimal.ZERO;
        private String paymentMethod; // CASH, CREDIT_CARD, BANK_TRANSFER, VNPAY_QR, MOMO
        private String paymentMethodDesc;
        private String transactionReference;
        private String status;
        private LocalDateTime paymentTime;
        private String note;

        public PaymentDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getPaymentCode() { return paymentCode; }
        public void setPaymentCode(String paymentCode) { this.paymentCode = paymentCode; }
        public Long getInvoiceId() { return invoiceId; }
        public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
        public Long getCashierId() { return cashierId; }
        public void setCashierId(Long cashierId) { this.cashierId = cashierId; }
        public String getCashierName() { return cashierName; }
        public void setCashierName(String cashierName) { this.cashierName = cashierName; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getPaymentMethodDesc() { return paymentMethodDesc; }
        public void setPaymentMethodDesc(String paymentMethodDesc) { this.paymentMethodDesc = paymentMethodDesc; }
        public String getTransactionReference() { return transactionReference; }
        public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDateTime getPaymentTime() { return paymentTime; }
        public void setPaymentTime(LocalDateTime paymentTime) { this.paymentTime = paymentTime; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }

        private String invoiceCode;
        private String patientName;
        private String paymentMethodLabel;

        public String getInvoiceCode() { return invoiceCode; }
        public void setInvoiceCode(String invoiceCode) { this.invoiceCode = invoiceCode; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getPaymentMethodLabel() { return paymentMethodLabel != null ? paymentMethodLabel : paymentMethodDesc; }
        public void setPaymentMethodLabel(String paymentMethodLabel) {
            this.paymentMethodLabel = paymentMethodLabel;
            this.paymentMethodDesc = paymentMethodLabel;
        }
    }

    // =========================================================================
    // CHI TIẾT HÓA ĐƠN ĐẦY ĐỦ
    // =========================================================================
    public static class InvoiceDetailDto {
        private Long id;
        private String invoiceCode;
        private Long patientId;
        private String patientName;
        private String patientCode;
        private String patientPhone;
        private String healthInsuranceNumber;
        private Long cashierId;
        private String cashierName;
        private Long appointmentId;
        private Long medicalRecordId;
        private String recordCode;
        private String doctorName;
        private String diagnosis;
        private BigDecimal totalServiceAmount = BigDecimal.ZERO;
        private BigDecimal totalMedicineAmount = BigDecimal.ZERO;
        private BigDecimal discountAmount = BigDecimal.ZERO;
        private BigDecimal insurancePaidAmount = BigDecimal.ZERO;
        private BigDecimal finalAmount = BigDecimal.ZERO;
        private String status; // UNPAID, PAID, REFUNDED, CANCELLED
        private String statusDesc;
        private String note;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
        private List<InvoiceItemDto> items = new ArrayList<>();
        private List<PaymentDto> payments = new ArrayList<>();

        public InvoiceDetailDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getInvoiceCode() { return invoiceCode; }
        public void setInvoiceCode(String invoiceCode) { this.invoiceCode = invoiceCode; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getPatientPhone() { return patientPhone; }
        public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        public Long getCashierId() { return cashierId; }
        public void setCashierId(Long cashierId) { this.cashierId = cashierId; }
        public String getCashierName() { return cashierName; }
        public void setCashierName(String cashierName) { this.cashierName = cashierName; }
        public Long getAppointmentId() { return appointmentId; }
        public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public String getRecordCode() { return recordCode; }
        public void setRecordCode(String recordCode) { this.recordCode = recordCode; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public BigDecimal getTotalServiceAmount() { return totalServiceAmount; }
        public void setTotalServiceAmount(BigDecimal totalServiceAmount) { this.totalServiceAmount = totalServiceAmount; }
        public BigDecimal getTotalMedicineAmount() { return totalMedicineAmount; }
        public void setTotalMedicineAmount(BigDecimal totalMedicineAmount) { this.totalMedicineAmount = totalMedicineAmount; }
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        public BigDecimal getInsurancePaidAmount() { return insurancePaidAmount; }
        public void setInsurancePaidAmount(BigDecimal insurancePaidAmount) { this.insurancePaidAmount = insurancePaidAmount; }
        public BigDecimal getFinalAmount() { return finalAmount; }
        public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getStatusDesc() { return statusDesc; }
        public void setStatusDesc(String statusDesc) { this.statusDesc = statusDesc; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getPaidAt() { return paidAt; }
        public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
        public List<InvoiceItemDto> getItems() { return items; }
        public void setItems(List<InvoiceItemDto> items) { this.items = items; }
        public List<PaymentDto> getPayments() { return payments; }
        public void setPayments(List<PaymentDto> payments) { this.payments = payments; }
    }

    // =========================================================================
    // REQUEST DTOs
    // =========================================================================

    // UC-TT01: Lập hóa đơn từ phiên khám
    public static class CreateInvoiceRequest {
        private Long medicalRecordId;
        private Long cashierId;
        private BigDecimal discountAmount;
        private BigDecimal insuranceRate; // % BHYT chi trả (ví dụ 80)
        private BigDecimal insurancePaidAmount;
        private String note;

        public CreateInvoiceRequest() {}

        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public Long getCashierId() { return cashierId; }
        public void setCashierId(Long cashierId) { this.cashierId = cashierId; }
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        public BigDecimal getInsuranceRate() { return insuranceRate; }
        public void setInsuranceRate(BigDecimal insuranceRate) { this.insuranceRate = insuranceRate; }
        public BigDecimal getInsurancePaidAmount() { return insurancePaidAmount; }
        public void setInsurancePaidAmount(BigDecimal insurancePaidAmount) { this.insurancePaidAmount = insurancePaidAmount; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    // UC-TT02: Áp dụng BHYT & Giảm giá
    public static class ApplyInsuranceDiscountRequest {
        private BigDecimal insuranceRate; // % BHYT chi trả
        private BigDecimal insurancePaidAmount; // Số tiền cụ thể
        private BigDecimal discountAmount; // Số tiền giảm giá
        private String discountReason; // Lý do giảm giá / mã voucher

        public ApplyInsuranceDiscountRequest() {}

        public BigDecimal getInsuranceRate() { return insuranceRate; }
        public void setInsuranceRate(BigDecimal insuranceRate) { this.insuranceRate = insuranceRate; }
        public BigDecimal getInsurancePaidAmount() { return insurancePaidAmount; }
        public void setInsurancePaidAmount(BigDecimal insurancePaidAmount) { this.insurancePaidAmount = insurancePaidAmount; }
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        public String getDiscountReason() { return discountReason; }
        public void setDiscountReason(String discountReason) { this.discountReason = discountReason; }
    }

    // UC-TT03: Thu tiền
    public static class ProcessPaymentRequest {
        private Long invoiceId;
        private Long cashierId;
        private BigDecimal amount;
        private String paymentMethod; // CASH, CREDIT_CARD, BANK_TRANSFER, VNPAY_QR, MOMO
        private String transactionReference;
        private BigDecimal customerGivenAmount; // Số tiền khách đưa (nếu trả tiền mặt)
        private String note;

        public ProcessPaymentRequest() {}

        public Long getInvoiceId() { return invoiceId; }
        public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
        public Long getCashierId() { return cashierId; }
        public void setCashierId(Long cashierId) { this.cashierId = cashierId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getTransactionReference() { return transactionReference; }
        public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
        public BigDecimal getCustomerGivenAmount() { return customerGivenAmount; }
        public void setCustomerGivenAmount(BigDecimal customerGivenAmount) { this.customerGivenAmount = customerGivenAmount; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class PaymentResponseDto {
        private boolean success;
        private String message;
        private String paymentCode;
        private String invoiceCode;
        private BigDecimal amountPaid;
        private BigDecimal changeAmount; // Tiền thừa trả khách
        private String paymentMethod;
        private LocalDateTime paymentTime;

        public PaymentResponseDto() {}

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getPaymentCode() { return paymentCode; }
        public void setPaymentCode(String paymentCode) { this.paymentCode = paymentCode; }
        public String getInvoiceCode() { return invoiceCode; }
        public void setInvoiceCode(String invoiceCode) { this.invoiceCode = invoiceCode; }
        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
        public BigDecimal getChangeAmount() { return changeAmount; }
        public void setChangeAmount(BigDecimal changeAmount) { this.changeAmount = changeAmount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public LocalDateTime getPaymentTime() { return paymentTime; }
        public void setPaymentTime(LocalDateTime paymentTime) { this.paymentTime = paymentTime; }
    }

    // UC-TT05: Hoàn tiền / Hủy giao dịch
    public static class RefundInvoiceRequest {
        private Long invoiceId;
        private Long actorId; // ID Thu ngân hoặc Quản lý
        private String reason; // Bắt buộc phải có lý do hủy/hoàn

        public RefundInvoiceRequest() {}

        public Long getInvoiceId() { return invoiceId; }
        public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
        public Long getActorId() { return actorId; }
        public void setActorId(Long actorId) { this.actorId = actorId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // UC-TT04: In hóa đơn chuẩn A4 / A5
    public static class InvoicePrintDto {
        private String clinicName = "Phòng khám Đa khoa Tiêu chuẩn CarePlus";
        private String clinicAddress = "Số 123 Đường Y Tế, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh";
        private String clinicPhone = "1800 6116 - 028 7300 3223";
        private String invoiceCode;
        private String printDate;
        private String patientName;
        private String patientCode;
        private String patientGender;
        private Integer patientAge;
        private String patientPhone;
        private String patientAddress;
        private String healthInsuranceNumber;
        private String doctorName;
        private String cashierName;
        private String diagnosis;
        private List<InvoiceItemDto> items = new ArrayList<>();
        private BigDecimal totalServiceAmount = BigDecimal.ZERO;
        private BigDecimal totalMedicineAmount = BigDecimal.ZERO;
        private BigDecimal discountAmount = BigDecimal.ZERO;
        private BigDecimal insurancePaidAmount = BigDecimal.ZERO;
        private BigDecimal finalAmount = BigDecimal.ZERO;
        private String amountInWords; // Số tiền bằng chữ
        private String paymentMethod;
        private String paymentStatus;
        private String note;

        public InvoicePrintDto() {}

        public String getClinicName() { return clinicName; }
        public void setClinicName(String clinicName) { this.clinicName = clinicName; }
        public String getClinicAddress() { return clinicAddress; }
        public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }
        public String getClinicPhone() { return clinicPhone; }
        public void setClinicPhone(String clinicPhone) { this.clinicPhone = clinicPhone; }
        public String getInvoiceCode() { return invoiceCode; }
        public void setInvoiceCode(String invoiceCode) { this.invoiceCode = invoiceCode; }
        public String getPrintDate() { return printDate; }
        public void setPrintDate(String printDate) { this.printDate = printDate; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getPatientGender() { return patientGender; }
        public void setPatientGender(String patientGender) { this.patientGender = patientGender; }
        public Integer getPatientAge() { return patientAge; }
        public void setPatientAge(Integer patientAge) { this.patientAge = patientAge; }
        public String getPatientPhone() { return patientPhone; }
        public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
        public String getPatientAddress() { return patientAddress; }
        public void setPatientAddress(String patientAddress) { this.patientAddress = patientAddress; }
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getCashierName() { return cashierName; }
        public void setCashierName(String cashierName) { this.cashierName = cashierName; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public List<InvoiceItemDto> getItems() { return items; }
        public void setItems(List<InvoiceItemDto> items) { this.items = items; }
        public BigDecimal getTotalServiceAmount() { return totalServiceAmount; }
        public void setTotalServiceAmount(BigDecimal totalServiceAmount) { this.totalServiceAmount = totalServiceAmount; }
        public BigDecimal getTotalMedicineAmount() { return totalMedicineAmount; }
        public void setTotalMedicineAmount(BigDecimal totalMedicineAmount) { this.totalMedicineAmount = totalMedicineAmount; }
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        public BigDecimal getInsurancePaidAmount() { return insurancePaidAmount; }
        public void setInsurancePaidAmount(BigDecimal insurancePaidAmount) { this.insurancePaidAmount = insurancePaidAmount; }
        public BigDecimal getFinalAmount() { return finalAmount; }
        public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }
        public String getAmountInWords() { return amountInWords; }
        public void setAmountInWords(String amountInWords) { this.amountInWords = amountInWords; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    // UC-TT06: Thống kê doanh thu viện phí
    public static class BillingStatsDto {
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private BigDecimal totalCash = BigDecimal.ZERO;
        private BigDecimal totalBankTransfer = BigDecimal.ZERO;
        private BigDecimal totalCard = BigDecimal.ZERO;
        private BigDecimal totalEWallet = BigDecimal.ZERO;
        private BigDecimal totalRefunded = BigDecimal.ZERO;
        private Long paidInvoiceCount = 0L;
        private Long unpaidInvoiceCount = 0L;
        private Long refundedInvoiceCount = 0L;

        public BillingStatsDto() {}

        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
        public BigDecimal getTotalCash() { return totalCash; }
        public void setTotalCash(BigDecimal totalCash) { this.totalCash = totalCash; }
        public BigDecimal getTotalBankTransfer() { return totalBankTransfer; }
        public void setTotalBankTransfer(BigDecimal totalBankTransfer) { this.totalBankTransfer = totalBankTransfer; }
        public BigDecimal getTotalCard() { return totalCard; }
        public void setTotalCard(BigDecimal totalCard) { this.totalCard = totalCard; }
        public BigDecimal getTotalEWallet() { return totalEWallet; }
        public void setTotalEWallet(BigDecimal totalEWallet) { this.totalEWallet = totalEWallet; }
        public BigDecimal getTotalRefunded() { return totalRefunded; }
        public void setTotalRefunded(BigDecimal totalRefunded) { this.totalRefunded = totalRefunded; }
        public Long getPaidInvoiceCount() { return paidInvoiceCount; }
        public void setPaidInvoiceCount(Long paidInvoiceCount) { this.paidInvoiceCount = paidInvoiceCount; }
        public Long getUnpaidInvoiceCount() { return unpaidInvoiceCount; }
        public void setUnpaidInvoiceCount(Long unpaidInvoiceCount) { this.unpaidInvoiceCount = unpaidInvoiceCount; }
        public Long getRefundedInvoiceCount() { return refundedInvoiceCount; }
        public void setRefundedInvoiceCount(Long refundedInvoiceCount) { this.refundedInvoiceCount = refundedInvoiceCount; }

        // Aliases for Frontend compatibility
        public BigDecimal getTodayRevenue() { return totalRevenue; }
        public Long getTodayPaidInvoicesCount() { return paidInvoiceCount; }
        public Long getPendingInvoicesCount() { return unpaidInvoiceCount; }
        public BigDecimal getCashTotal() { return totalCash; }
        public BigDecimal getTransferTotal() { return totalBankTransfer; }
        public BigDecimal getCardTotal() { return totalCard; }
        public BigDecimal getQrTotal() { return totalEWallet; }
    }

    // UC-TT07: Quản lý bảng giá dịch vụ
    public static class ServicePriceDto {
        private Long id;
        private Long categoryId;
        private String categoryName;
        private String code;
        private String name;
        private BigDecimal price;
        private Boolean insuranceCovered;
        private Integer estimatedDurationMinutes;
        private String description;
        private Boolean isActive;

        public ServicePriceDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public Boolean getInsuranceCovered() { return insuranceCovered; }
        public void setInsuranceCovered(Boolean insuranceCovered) { this.insuranceCovered = insuranceCovered; }
        public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
        public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }

        // Aliases for Frontend
        public String getServiceCode() { return code; }
        public String getServiceName() { return name; }
        public String getServiceType() { return categoryName != null ? categoryName : "Dịch vụ y tế"; }
        public BigDecimal getUnitPrice() { return price; }
        public Integer getInsuranceCoverageRate() { return Boolean.TRUE.equals(insuranceCovered) ? 80 : 0; }
        public String getDepartmentName() { return categoryName; }
    }

    public static class SaveServicePriceRequest {
        private Long id;
        private Long categoryId;
        private String code;
        private String name;
        private BigDecimal price;
        private Boolean insuranceCovered;
        private Integer estimatedDurationMinutes;
        private String description;
        private Boolean isActive;

        // Aliases from frontend
        private String serviceCode;
        private String serviceName;
        private String serviceType;
        private BigDecimal unitPrice;
        private Integer insuranceCoverageRate;

        public SaveServicePriceRequest() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public String getCode() { return code != null ? code : serviceCode; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name != null ? name : serviceName; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getPrice() { return price != null ? price : unitPrice; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public Boolean getInsuranceCovered() {
            if (insuranceCovered != null) return insuranceCovered;
            return insuranceCoverageRate != null && insuranceCoverageRate > 0;
        }
        public void setInsuranceCovered(Boolean insuranceCovered) { this.insuranceCovered = insuranceCovered; }
        public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
        public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }

        public String getServiceCode() { return serviceCode; }
        public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }
        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }
        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public Integer getInsuranceCoverageRate() { return insuranceCoverageRate; }
        public void setInsuranceCoverageRate(Integer insuranceCoverageRate) { this.insuranceCoverageRate = insuranceCoverageRate; }
    }

    public static class MedicalCandidateDto {
        private Long medicalRecordId;
        private String recordCode;
        private Long patientId;
        private String patientCode;
        private String patientName;
        private String patientPhone;
        private String doctorName;
        private String diagnosis;
        private String completedAt;
        private boolean invoiceCreated;
        private Long invoiceId;
        private String invoiceCode;

        public MedicalCandidateDto() {}

        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public String getRecordCode() { return recordCode; }
        public void setRecordCode(String recordCode) { this.recordCode = recordCode; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getPatientPhone() { return patientPhone; }
        public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public String getCompletedAt() { return completedAt; }
        public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
        public boolean isInvoiceCreated() { return invoiceCreated; }
        public void setInvoiceCreated(boolean invoiceCreated) { this.invoiceCreated = invoiceCreated; }
        public Long getInvoiceId() { return invoiceId; }
        public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
        public String getInvoiceCode() { return invoiceCode; }
        public void setInvoiceCode(String invoiceCode) { this.invoiceCode = invoiceCode; }
    }
}
