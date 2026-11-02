package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.BillingDtos.*;
import com.clinic.clinic_management.service.BillingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@CrossOrigin(origins = "*")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    // =========================================================================
    // UC-TT01: LẬP HÓA ĐƠN TỪ PHIÊN KHÁM (THU NGÂN)
    // =========================================================================
    @GetMapping("/candidates")
    public ResponseEntity<List<MedicalCandidateDto>> getCandidates() {
        return ResponseEntity.ok(billingService.getCandidates());
    }

    @PostMapping({"/invoices", "/invoices/from-record"})
    public ResponseEntity<InvoiceDetailDto> createInvoiceFromMedicalRecord(@RequestBody CreateInvoiceRequest req) {
        return ResponseEntity.ok(billingService.createInvoiceFromMedicalRecord(req));
    }

    // =========================================================================
    // UC-TT02: ÁP DỤNG BẢO HIỂM Y TẾ / GIẢM GIÁ (THU NGÂN)
    // =========================================================================
    @PostMapping({"/invoices/{id}/discount", "/invoices/{id}/apply-discount"})
    public ResponseEntity<InvoiceDetailDto> applyInsuranceAndDiscount(
            @PathVariable Long id,
            @RequestBody ApplyInsuranceDiscountRequest req
    ) {
        return ResponseEntity.ok(billingService.applyInsuranceAndDiscount(id, req));
    }

    // =========================================================================
    // UC-TT03: THU TIỀN (TIỀN MẶT, THẺ, VÍ ĐIỆN TỬ, CHUYỂN KHOẢN) (THU NGÂN)
    // =========================================================================
    @PostMapping("/payments")
    public ResponseEntity<PaymentResponseDto> processPayment(@RequestBody ProcessPaymentRequest req) {
        return ResponseEntity.ok(billingService.processPayment(req));
    }

    // =========================================================================
    // UC-TT04: IN / GỬI HÓA ĐƠN (THU NGÂN)
    // =========================================================================
    @GetMapping("/invoices/{id}/print")
    public ResponseEntity<InvoicePrintDto> getInvoicePrintData(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getInvoicePrintData(id));
    }

    @PostMapping("/invoices/{id}/send-email")
    public ResponseEntity<Map<String, Object>> sendInvoiceEmail(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String email = body != null ? body.get("email") : null;
        boolean sent = billingService.sendInvoiceEmail(id, email);
        return ResponseEntity.ok(Map.of("success", sent, "message", "Hóa đơn điện tử đã được gửi tới email " + email));
    }

    // =========================================================================
    // UC-TT05: HOÀN TIỀN / HỦY GIAO DỊCH (THU NGÂN, QUẢN LÝ)
    // =========================================================================
    @PostMapping({"/refund", "/invoices/refund"})
    public ResponseEntity<InvoiceDetailDto> refundOrCancelInvoice(@RequestBody RefundInvoiceRequest req) {
        return ResponseEntity.ok(billingService.refundOrCancelInvoice(req));
    }

    // =========================================================================
    // UC-TT06: XEM LỊCH SỬ GIAO DỊCH & THỐNG KÊ DOANH THU (THU NGÂN, QUẢN LÝ, BỆNH NHÂN)
    // =========================================================================
    @GetMapping("/payments")
    public ResponseEntity<List<PaymentDto>> getAllPayments() {
        return ResponseEntity.ok(billingService.getAllPayments());
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<InvoiceDetailDto>> getInvoices(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(billingService.getInvoices(status, fromDate, toDate, query));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<InvoiceDetailDto> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getInvoiceById(id));
    }

    @GetMapping("/invoices/patient/{patientId}")
    public ResponseEntity<List<InvoiceDetailDto>> getInvoicesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(billingService.getInvoicesByPatient(patientId));
    }

    @GetMapping("/stats")
    public ResponseEntity<BillingStatsDto> getBillingOverviewStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(billingService.getBillingOverviewStats(fromDate, toDate));
    }

    // =========================================================================
    // UC-TT07: QUẢN LÝ BẢNG GIÁ DỊCH VỤ (QUẢN LÝ)
    // =========================================================================
    @GetMapping("/services")
    public ResponseEntity<List<ServicePriceDto>> getAllServices(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId
    ) {
        return ResponseEntity.ok(billingService.getAllServices(query, categoryId));
    }

    @PostMapping("/services")
    public ResponseEntity<ServicePriceDto> saveServicePrice(@RequestBody SaveServicePriceRequest req) {
        return ResponseEntity.ok(billingService.saveServicePrice(req));
    }
}
