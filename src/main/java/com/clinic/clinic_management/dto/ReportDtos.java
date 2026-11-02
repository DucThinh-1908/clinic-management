package com.clinic.clinic_management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReportDtos {

    // =========================================================================
    // UC-BC01: BÁO CÁO DOANH THU THEO NGÀY / THÁNG / NĂM
    // =========================================================================
    public static class RevenueReportDto {
        private String period; // DAILY, MONTHLY, YEARLY, CUSTOM
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private BigDecimal totalServiceRevenue = BigDecimal.ZERO;
        private BigDecimal totalMedicineRevenue = BigDecimal.ZERO;
        private BigDecimal totalInsurancePaid = BigDecimal.ZERO;
        private BigDecimal totalDiscount = BigDecimal.ZERO;
        private BigDecimal totalRefunded = BigDecimal.ZERO;
        private BigDecimal netRevenue = BigDecimal.ZERO;
        private Long paidInvoiceCount = 0L;
        private Map<String, BigDecimal> paymentMethodBreakdown = new HashMap<>();
        private List<RevenueTimePointDto> timelineData = new ArrayList<>();

        public RevenueReportDto() {}

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
        public BigDecimal getTotalServiceRevenue() { return totalServiceRevenue; }
        public void setTotalServiceRevenue(BigDecimal totalServiceRevenue) { this.totalServiceRevenue = totalServiceRevenue; }
        public BigDecimal getTotalMedicineRevenue() { return totalMedicineRevenue; }
        public void setTotalMedicineRevenue(BigDecimal totalMedicineRevenue) { this.totalMedicineRevenue = totalMedicineRevenue; }
        public BigDecimal getTotalInsurancePaid() { return totalInsurancePaid; }
        public void setTotalInsurancePaid(BigDecimal totalInsurancePaid) { this.totalInsurancePaid = totalInsurancePaid; }
        public BigDecimal getTotalDiscount() { return totalDiscount; }
        public void setTotalDiscount(BigDecimal totalDiscount) { this.totalDiscount = totalDiscount; }
        public BigDecimal getTotalRefunded() { return totalRefunded; }
        public void setTotalRefunded(BigDecimal totalRefunded) { this.totalRefunded = totalRefunded; }
        public BigDecimal getNetRevenue() { return netRevenue; }
        public void setNetRevenue(BigDecimal netRevenue) { this.netRevenue = netRevenue; }
        public Long getPaidInvoiceCount() { return paidInvoiceCount; }
        public void setPaidInvoiceCount(Long paidInvoiceCount) { this.paidInvoiceCount = paidInvoiceCount; }
        public Map<String, BigDecimal> getPaymentMethodBreakdown() { return paymentMethodBreakdown; }
        public void setPaymentMethodBreakdown(Map<String, BigDecimal> paymentMethodBreakdown) { this.paymentMethodBreakdown = paymentMethodBreakdown; }
        public List<RevenueTimePointDto> getTimelineData() { return timelineData; }
        public void setTimelineData(List<RevenueTimePointDto> timelineData) { this.timelineData = timelineData; }
    }

    public static class RevenueTimePointDto {
        private String label; // 01/11, 02/11 hoặc Tháng 01, Tháng 02...
        private String dateStr;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private BigDecimal serviceAmount = BigDecimal.ZERO;
        private BigDecimal medicineAmount = BigDecimal.ZERO;
        private Long invoiceCount = 0L;

        public RevenueTimePointDto() {}

        public RevenueTimePointDto(String label, String dateStr, BigDecimal totalAmount, BigDecimal serviceAmount, BigDecimal medicineAmount, Long invoiceCount) {
            this.label = label;
            this.dateStr = dateStr;
            this.totalAmount = totalAmount;
            this.serviceAmount = serviceAmount;
            this.medicineAmount = medicineAmount;
            this.invoiceCount = invoiceCount;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getDateStr() { return dateStr; }
        public void setDateStr(String dateStr) { this.dateStr = dateStr; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public BigDecimal getServiceAmount() { return serviceAmount; }
        public void setServiceAmount(BigDecimal serviceAmount) { this.serviceAmount = serviceAmount; }
        public BigDecimal getMedicineAmount() { return medicineAmount; }
        public void setMedicineAmount(BigDecimal medicineAmount) { this.medicineAmount = medicineAmount; }
        public Long getInvoiceCount() { return invoiceCount; }
        public void setInvoiceCount(Long invoiceCount) { this.invoiceCount = invoiceCount; }
    }

    // =========================================================================
    // UC-BC02: BÁO CÁO DOANH THU THEO DỊCH VỤ VÀ BÁC SĨ
    // =========================================================================
    public static class DoctorServiceRevenueDto {
        private List<TopServiceItemDto> topServices = new ArrayList<>();
        private List<DoctorRevenueItemDto> doctorRevenues = new ArrayList<>();
        private BigDecimal totalServicesAmount = BigDecimal.ZERO;
        private Long totalServiceExecutions = 0L;

        public DoctorServiceRevenueDto() {}

        public List<TopServiceItemDto> getTopServices() { return topServices; }
        public void setTopServices(List<TopServiceItemDto> topServices) { this.topServices = topServices; }
        public List<DoctorRevenueItemDto> getDoctorRevenues() { return doctorRevenues; }
        public void setDoctorRevenues(List<DoctorRevenueItemDto> doctorRevenues) { this.doctorRevenues = doctorRevenues; }
        public BigDecimal getTotalServicesAmount() { return totalServicesAmount; }
        public void setTotalServicesAmount(BigDecimal totalServicesAmount) { this.totalServicesAmount = totalServicesAmount; }
        public Long getTotalServiceExecutions() { return totalServiceExecutions; }
        public void setTotalServiceExecutions(Long totalServiceExecutions) { this.totalServiceExecutions = totalServiceExecutions; }
    }

    public static class TopServiceItemDto {
        private String serviceName;
        private String serviceType;
        private Long quantity = 0L;
        private BigDecimal unitPrice = BigDecimal.ZERO;
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private Double percentage = 0.0;

        public TopServiceItemDto() {}

        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }
        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
        public Long getQuantity() { return quantity; }
        public void setQuantity(Long quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
    }

    public static class DoctorRevenueItemDto {
        private Long doctorId;
        private String doctorName;
        private String staffCode;
        private String departmentName;
        private Long examinationCount = 0L;
        private BigDecimal serviceRevenue = BigDecimal.ZERO;
        private BigDecimal medicineRevenue = BigDecimal.ZERO;
        private BigDecimal totalRevenue = BigDecimal.ZERO;

        public DoctorRevenueItemDto() {}

        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getStaffCode() { return staffCode; }
        public void setStaffCode(String staffCode) { this.staffCode = staffCode; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Long getExaminationCount() { return examinationCount; }
        public void setExaminationCount(Long examinationCount) { this.examinationCount = examinationCount; }
        public BigDecimal getServiceRevenue() { return serviceRevenue; }
        public void setServiceRevenue(BigDecimal serviceRevenue) { this.serviceRevenue = serviceRevenue; }
        public BigDecimal getMedicineRevenue() { return medicineRevenue; }
        public void setMedicineRevenue(BigDecimal medicineRevenue) { this.medicineRevenue = medicineRevenue; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    }

    // =========================================================================
    // UC-BC03: BÁO CÁO LƯỢT KHÁM
    // =========================================================================
    public static class VisitReportDto {
        private Long totalVisits = 0L;
        private Long completedVisits = 0L;
        private Long inProgressVisits = 0L;
        private Long waitingVisits = 0L;
        private List<DepartmentVisitDto> departmentVisits = new ArrayList<>();
        private DemographicVisitDto demographics = new DemographicVisitDto();
        private List<DailyVisitTrendDto> dailyTrends = new ArrayList<>();

        public VisitReportDto() {}

        public Long getTotalVisits() { return totalVisits; }
        public void setTotalVisits(Long totalVisits) { this.totalVisits = totalVisits; }
        public Long getCompletedVisits() { return completedVisits; }
        public void setCompletedVisits(Long completedVisits) { this.completedVisits = completedVisits; }
        public Long getInProgressVisits() { return inProgressVisits; }
        public void setInProgressVisits(Long inProgressVisits) { this.inProgressVisits = inProgressVisits; }
        public Long getWaitingVisits() { return waitingVisits; }
        public void setWaitingVisits(Long waitingVisits) { this.waitingVisits = waitingVisits; }
        public List<DepartmentVisitDto> getDepartmentVisits() { return departmentVisits; }
        public void setDepartmentVisits(List<DepartmentVisitDto> departmentVisits) { this.departmentVisits = departmentVisits; }
        public DemographicVisitDto getDemographics() { return demographics; }
        public void setDemographics(DemographicVisitDto demographics) { this.demographics = demographics; }
        public List<DailyVisitTrendDto> getDailyTrends() { return dailyTrends; }
        public void setDailyTrends(List<DailyVisitTrendDto> dailyTrends) { this.dailyTrends = dailyTrends; }
    }

    public static class DepartmentVisitDto {
        private String departmentName;
        private Long visitCount = 0L;
        private Double percentage = 0.0;

        public DepartmentVisitDto() {}
        public DepartmentVisitDto(String departmentName, Long visitCount, Double percentage) {
            this.departmentName = departmentName;
            this.visitCount = visitCount;
            this.percentage = percentage;
        }

        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Long getVisitCount() { return visitCount; }
        public void setVisitCount(Long visitCount) { this.visitCount = visitCount; }
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
    }

    public static class DemographicVisitDto {
        private Long maleCount = 0L;
        private Long femaleCount = 0L;
        private Long withInsuranceCount = 0L;
        private Long withoutInsuranceCount = 0L;
        private Long childrenCount = 0L; // < 16 tuổi
        private Long adultCount = 0L;    // 16 - 60 tuổi
        private Long elderlyCount = 0L;  // > 60 tuổi

        public DemographicVisitDto() {}

        public Long getMaleCount() { return maleCount; }
        public void setMaleCount(Long maleCount) { this.maleCount = maleCount; }
        public Long getFemaleCount() { return femaleCount; }
        public void setFemaleCount(Long femaleCount) { this.femaleCount = femaleCount; }
        public Long getWithInsuranceCount() { return withInsuranceCount; }
        public void setWithInsuranceCount(Long withInsuranceCount) { this.withInsuranceCount = withInsuranceCount; }
        public Long getWithoutInsuranceCount() { return withoutInsuranceCount; }
        public void setWithoutInsuranceCount(Long withoutInsuranceCount) { this.withoutInsuranceCount = withoutInsuranceCount; }
        public Long getChildrenCount() { return childrenCount; }
        public void setChildrenCount(Long childrenCount) { this.childrenCount = childrenCount; }
        public Long getAdultCount() { return adultCount; }
        public void setAdultCount(Long adultCount) { this.adultCount = adultCount; }
        public Long getElderlyCount() { return elderlyCount; }
        public void setElderlyCount(Long elderlyCount) { this.elderlyCount = elderlyCount; }
    }

    public static class DailyVisitTrendDto {
        private String dateStr;
        private String dayOfWeek;
        private Long visitCount = 0L;

        public DailyVisitTrendDto() {}
        public DailyVisitTrendDto(String dateStr, String dayOfWeek, Long visitCount) {
            this.dateStr = dateStr;
            this.dayOfWeek = dayOfWeek;
            this.visitCount = visitCount;
        }

        public String getDateStr() { return dateStr; }
        public void setDateStr(String dateStr) { this.dateStr = dateStr; }
        public String getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
        public Long getVisitCount() { return visitCount; }
        public void setVisitCount(Long visitCount) { this.visitCount = visitCount; }
    }

    // =========================================================================
    // UC-BC04: THỐNG KÊ BỆNH THƯỜNG GẶP
    // =========================================================================
    public static class CommonDiseaseReportDto {
        private Long totalDiagnoses = 0L;
        private List<DiseaseStatDto> topDiseases = new ArrayList<>();

        public CommonDiseaseReportDto() {}

        public Long getTotalDiagnoses() { return totalDiagnoses; }
        public void setTotalDiagnoses(Long totalDiagnoses) { this.totalDiagnoses = totalDiagnoses; }
        public List<DiseaseStatDto> getTopDiseases() { return topDiseases; }
        public void setTopDiseases(List<DiseaseStatDto> topDiseases) { this.topDiseases = topDiseases; }
    }

    public static class DiseaseStatDto {
        private String diseaseName;
        private String icd10Code;
        private Long caseCount = 0L;
        private Double percentage = 0.0;
        private String commonAgeGroup;
        private String primaryDepartment;

        public DiseaseStatDto() {}

        public String getDiseaseName() { return diseaseName; }
        public void setDiseaseName(String diseaseName) { this.diseaseName = diseaseName; }
        public String getIcd10Code() { return icd10Code; }
        public void setIcd10Code(String icd10Code) { this.icd10Code = icd10Code; }
        public Long getCaseCount() { return caseCount; }
        public void setCaseCount(Long caseCount) { this.caseCount = caseCount; }
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
        public String getCommonAgeGroup() { return commonAgeGroup; }
        public void setCommonAgeGroup(String commonAgeGroup) { this.commonAgeGroup = commonAgeGroup; }
        public String getPrimaryDepartment() { return primaryDepartment; }
        public void setPrimaryDepartment(String primaryDepartment) { this.primaryDepartment = primaryDepartment; }
    }

    // =========================================================================
    // UC-BC05: BÁO CÁO THUỐC DÙNG VÀ TỒN KHO
    // =========================================================================
    public static class MedicineStockReportDto {
        private List<TopMedicineItemDto> topPrescribedMedicines = new ArrayList<>();
        private StockOverviewDto stockOverview = new StockOverviewDto();
        private List<StockAlertItemDto> alertItems = new ArrayList<>();

        public MedicineStockReportDto() {}

        public List<TopMedicineItemDto> getTopPrescribedMedicines() { return topPrescribedMedicines; }
        public void setTopPrescribedMedicines(List<TopMedicineItemDto> topPrescribedMedicines) { this.topPrescribedMedicines = topPrescribedMedicines; }
        public StockOverviewDto getStockOverview() { return stockOverview; }
        public void setStockOverview(StockOverviewDto stockOverview) { this.stockOverview = stockOverview; }
        public List<StockAlertItemDto> getAlertItems() { return alertItems; }
        public void setAlertItems(List<StockAlertItemDto> alertItems) { this.alertItems = alertItems; }
    }

    public static class TopMedicineItemDto {
        private Long medicineId;
        private String medicineCode;
        private String brandName;
        private String activeIngredient;
        private String unit;
        private Long totalQuantityDispensed = 0L;
        private BigDecimal totalAmount = BigDecimal.ZERO;

        public TopMedicineItemDto() {}

        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public String getMedicineCode() { return medicineCode; }
        public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }
        public String getBrandName() { return brandName; }
        public void setBrandName(String brandName) { this.brandName = brandName; }
        public String getActiveIngredient() { return activeIngredient; }
        public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public Long getTotalQuantityDispensed() { return totalQuantityDispensed; }
        public void setTotalQuantityDispensed(Long totalQuantityDispensed) { this.totalQuantityDispensed = totalQuantityDispensed; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    }

    public static class StockOverviewDto {
        private BigDecimal totalInventoryValue = BigDecimal.ZERO;
        private Long totalMedicinesCount = 0L;
        private Long totalBatchesCount = 0L;
        private Long lowStockCount = 0L;
        private Long nearExpiryCount = 0L;
        private Long expiredCount = 0L;

        public StockOverviewDto() {}

        public BigDecimal getTotalInventoryValue() { return totalInventoryValue; }
        public void setTotalInventoryValue(BigDecimal totalInventoryValue) { this.totalInventoryValue = totalInventoryValue; }
        public Long getTotalMedicinesCount() { return totalMedicinesCount; }
        public void setTotalMedicinesCount(Long totalMedicinesCount) { this.totalMedicinesCount = totalMedicinesCount; }
        public Long getTotalBatchesCount() { return totalBatchesCount; }
        public void setTotalBatchesCount(Long totalBatchesCount) { this.totalBatchesCount = totalBatchesCount; }
        public Long getLowStockCount() { return lowStockCount; }
        public void setLowStockCount(Long lowStockCount) { this.lowStockCount = lowStockCount; }
        public Long getNearExpiryCount() { return nearExpiryCount; }
        public void setNearExpiryCount(Long nearExpiryCount) { this.nearExpiryCount = nearExpiryCount; }
        public Long getExpiredCount() { return expiredCount; }
        public void setExpiredCount(Long expiredCount) { this.expiredCount = expiredCount; }
    }

    public static class StockAlertItemDto {
        private String alertType; // LOW_STOCK, NEAR_EXPIRY, EXPIRED
        private String medicineName;
        private String batchNumber;
        private Integer availableQuantity;
        private String expiryDate;
        private String severity; // CRITICAL, WARNING

        public StockAlertItemDto() {}

        public String getAlertType() { return alertType; }
        public void setAlertType(String alertType) { this.alertType = alertType; }
        public String getMedicineName() { return medicineName; }
        public void setMedicineName(String medicineName) { this.medicineName = medicineName; }
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
        public Integer getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }
        public String getExpiryDate() { return expiryDate; }
        public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
    }

    // =========================================================================
    // UC-BC06: BÁO CÁO LỊCH HẸN (TỶ LỆ HỦY, NO-SHOW)
    // =========================================================================
    public static class AppointmentReportDto {
        private Long totalAppointments = 0L;
        private Long completedCount = 0L;
        private Long confirmedCount = 0L;
        private Long cancelledCount = 0L;
        private Long noShowCount = 0L;
        private Double cancellationRate = 0.0;
        private Double noShowRate = 0.0;
        private Double completionRate = 0.0;
        private List<CancellationReasonStatDto> cancellationReasons = new ArrayList<>();
        private List<AppointmentChannelStatDto> channelStats = new ArrayList<>();

        public AppointmentReportDto() {}

        public Long getTotalAppointments() { return totalAppointments; }
        public void setTotalAppointments(Long totalAppointments) { this.totalAppointments = totalAppointments; }
        public Long getCompletedCount() { return completedCount; }
        public void setCompletedCount(Long completedCount) { this.completedCount = completedCount; }
        public Long getConfirmedCount() { return confirmedCount; }
        public void setConfirmedCount(Long confirmedCount) { this.confirmedCount = confirmedCount; }
        public Long getCancelledCount() { return cancelledCount; }
        public void setCancelledCount(Long cancelledCount) { this.cancelledCount = cancelledCount; }
        public Long getNoShowCount() { return noShowCount; }
        public void setNoShowCount(Long noShowCount) { this.noShowCount = noShowCount; }
        public Double getCancellationRate() { return cancellationRate; }
        public void setCancellationRate(Double cancellationRate) { this.cancellationRate = cancellationRate; }
        public Double getNoShowRate() { return noShowRate; }
        public void setNoShowRate(Double noShowRate) { this.noShowRate = noShowRate; }
        public Double getCompletionRate() { return completionRate; }
        public void setCompletionRate(Double completionRate) { this.completionRate = completionRate; }
        public List<CancellationReasonStatDto> getCancellationReasons() { return cancellationReasons; }
        public void setCancellationReasons(List<CancellationReasonStatDto> cancellationReasons) { this.cancellationReasons = cancellationReasons; }
        public List<AppointmentChannelStatDto> getChannelStats() { return channelStats; }
        public void setChannelStats(List<AppointmentChannelStatDto> channelStats) { this.channelStats = channelStats; }
    }

    public static class CancellationReasonStatDto {
        private String reason;
        private Long count = 0L;
        private Double percentage = 0.0;

        public CancellationReasonStatDto() {}
        public CancellationReasonStatDto(String reason, Long count, Double percentage) {
            this.reason = reason;
            this.count = count;
            this.percentage = percentage;
        }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
    }

    public static class AppointmentChannelStatDto {
        private String channel;
        private Long count = 0L;
        private Double percentage = 0.0;

        public AppointmentChannelStatDto() {}
        public AppointmentChannelStatDto(String channel, Long count, Double percentage) {
            this.channel = channel;
            this.count = count;
            this.percentage = percentage;
        }

        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
    }

    // =========================================================================
    // UC-BC07: DASHBOARD THỜI GIAN THỰC
    // =========================================================================
    public static class RealtimeDashboardDto {
        private Long todayPatientsRegistered = 0L;
        private Long waitingConsultationCount = 0L;
        private Long inConsultationCount = 0L;
        private Long completedConsultationCount = 0L;
        private Long activeDoctorsCount = 0L;
        private BigDecimal todayRevenue = BigDecimal.ZERO;
        private Long todayPrescriptionsCount = 0L;
        private String lastUpdated;
        private List<HourlyVisitDto> hourlyVisits = new ArrayList<>();
        private List<DashboardRecentActivityDto> recentActivities = new ArrayList<>();

        public RealtimeDashboardDto() {}

        public Long getTodayPatientsRegistered() { return todayPatientsRegistered; }
        public void setTodayPatientsRegistered(Long todayPatientsRegistered) { this.todayPatientsRegistered = todayPatientsRegistered; }
        public Long getWaitingConsultationCount() { return waitingConsultationCount; }
        public void setWaitingConsultationCount(Long waitingConsultationCount) { this.waitingConsultationCount = waitingConsultationCount; }
        public Long getInConsultationCount() { return inConsultationCount; }
        public void setInConsultationCount(Long inConsultationCount) { this.inConsultationCount = inConsultationCount; }
        public Long getCompletedConsultationCount() { return completedConsultationCount; }
        public void setCompletedConsultationCount(Long completedConsultationCount) { this.completedConsultationCount = completedConsultationCount; }
        public Long getActiveDoctorsCount() { return activeDoctorsCount; }
        public void setActiveDoctorsCount(Long activeDoctorsCount) { this.activeDoctorsCount = activeDoctorsCount; }
        public BigDecimal getTodayRevenue() { return todayRevenue; }
        public void setTodayRevenue(BigDecimal todayRevenue) { this.todayRevenue = todayRevenue; }
        public Long getTodayPrescriptionsCount() { return todayPrescriptionsCount; }
        public void setTodayPrescriptionsCount(Long todayPrescriptionsCount) { this.todayPrescriptionsCount = todayPrescriptionsCount; }
        public String getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }
        public List<HourlyVisitDto> getHourlyVisits() { return hourlyVisits; }
        public void setHourlyVisits(List<HourlyVisitDto> hourlyVisits) { this.hourlyVisits = hourlyVisits; }
        public List<DashboardRecentActivityDto> getRecentActivities() { return recentActivities; }
        public void setRecentActivities(List<DashboardRecentActivityDto> recentActivities) { this.recentActivities = recentActivities; }
    }

    public static class HourlyVisitDto {
        private String hourLabel; // 07:00, 08:00...
        private Long visitCount = 0L;

        public HourlyVisitDto() {}
        public HourlyVisitDto(String hourLabel, Long visitCount) {
            this.hourLabel = hourLabel;
            this.visitCount = visitCount;
        }

        public String getHourLabel() { return hourLabel; }
        public void setHourLabel(String hourLabel) { this.hourLabel = hourLabel; }
        public Long getVisitCount() { return visitCount; }
        public void setVisitCount(Long visitCount) { this.visitCount = visitCount; }
    }

    public static class DashboardRecentActivityDto {
        private String time;
        private String activityType; // INVOICE, CONSULTATION, DISPENSE, APPOINTMENT
        private String description;
        private String amount;
        private String status;

        public DashboardRecentActivityDto() {}
        public DashboardRecentActivityDto(String time, String activityType, String description, String amount, String status) {
            this.time = time;
            this.activityType = activityType;
            this.description = description;
            this.amount = amount;
            this.status = status;
        }

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public String getActivityType() { return activityType; }
        public void setActivityType(String activityType) { this.activityType = activityType; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getAmount() { return amount; }
        public void setAmount(String amount) { this.amount = amount; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
