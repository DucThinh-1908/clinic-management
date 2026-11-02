package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.ReportDtos.*;
import com.clinic.clinic_management.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // =========================================================================
    // UC-BC01: BÁO CÁO DOANH THU THEO NGÀY/THÁNG/NĂM
    // =========================================================================
    @GetMapping("/revenue")
    public ResponseEntity<RevenueReportDto> getRevenueReport(
            @RequestParam(required = false, defaultValue = "CUSTOM") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(reportService.getRevenueReport(period, fromDate, toDate));
    }

    // =========================================================================
    // UC-BC02: BÁO CÁO DOANH THU THEO DỊCH VỤ VÀ BÁC SĨ
    // =========================================================================
    @GetMapping("/doctor-service-revenue")
    public ResponseEntity<DoctorServiceRevenueDto> getDoctorServiceRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(reportService.getDoctorServiceRevenue(fromDate, toDate));
    }

    // =========================================================================
    // UC-BC03: BÁO CÁO LƯỢT KHÁM
    // =========================================================================
    @GetMapping("/visits")
    public ResponseEntity<VisitReportDto> getVisitReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(reportService.getVisitReport(fromDate, toDate));
    }

    // =========================================================================
    // UC-BC04: THỐNG KÊ BỆNH THƯỜNG GẶP
    // =========================================================================
    @GetMapping("/common-diseases")
    public ResponseEntity<CommonDiseaseReportDto> getCommonDiseases(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        return ResponseEntity.ok(reportService.getCommonDiseases(fromDate, toDate, limit));
    }

    // =========================================================================
    // UC-BC05: BÁO CÁO THUỐC DÙNG VÀ TỒN KHO
    // =========================================================================
    @GetMapping("/medicine-stock")
    public ResponseEntity<MedicineStockReportDto> getMedicineStockReport() {
        return ResponseEntity.ok(reportService.getMedicineStockReport());
    }

    // =========================================================================
    // UC-BC06: BÁO CÁO LỊCH HẸN (TỶ LỆ HỦY, NO-SHOW)
    // =========================================================================
    @GetMapping("/appointments")
    public ResponseEntity<AppointmentReportDto> getAppointmentReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(reportService.getAppointmentReport(fromDate, toDate));
    }

    // =========================================================================
    // UC-BC07: DASHBOARD THỜI GIAN THỰC
    // =========================================================================
    @GetMapping("/realtime-dashboard")
    public ResponseEntity<RealtimeDashboardDto> getRealtimeDashboard() {
        return ResponseEntity.ok(reportService.getRealtimeDashboard());
    }

    // =========================================================================
    // UC-BC08: XUẤT BÁO CÁO EXCEL / CSV
    // =========================================================================
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam(defaultValue = "REVENUE") String reportType,
            @RequestParam(defaultValue = "EXCEL") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        byte[] csvData = reportService.exportReportToCsv(reportType, fromDate, toDate);

        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String filename = "BaoCao_" + reportType.toUpperCase() + "_" + dateStr + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
