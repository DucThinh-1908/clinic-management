package com.clinic.clinic_management;

import com.clinic.clinic_management.controller.WebController;
import com.clinic.clinic_management.dto.AccountDtos.*;
import com.clinic.clinic_management.dto.AuthDtos.*;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.repository.AppointmentRepository;
import com.clinic.clinic_management.repository.RoleRepository;
import com.clinic.clinic_management.repository.StaffScheduleRepository;
import com.clinic.clinic_management.service.*;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ClinicManagementApplicationTests {

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private AuthService authService;

	@Autowired
	private AccountManagementService accountManagementService;

	@Autowired
	private RolePermissionService rolePermissionService;

	@Autowired
	private RecordAccessLogService recordAccessLogService;

	@Autowired
	private StaffSchedulingService staffSchedulingService;

	@Autowired
	private StaffScheduleRepository staffScheduleRepository;

	@Autowired
	private AppointmentRepository appointmentRepository;

	@Autowired
	private AppointmentService appointmentService;

	@Autowired
	private com.clinic.clinic_management.service.QueueService queueService;

	@Autowired
	private com.clinic.clinic_management.repository.QueueTicketRepository queueTicketRepository;

	@Autowired
	private MedicalExaminationService medicalExaminationService;

	@Autowired
	private com.clinic.clinic_management.service.PharmacyService pharmacyService;

	@Autowired
	private com.clinic.clinic_management.repository.PatientRepository patientRepository;

	@Autowired
	private com.clinic.clinic_management.service.BillingService billingService;

	@Autowired
	private com.clinic.clinic_management.controller.BillingController billingController;

	@Autowired
	private com.clinic.clinic_management.service.ReportService reportService;

	@Autowired
	private com.clinic.clinic_management.controller.ReportController reportController;

	@Test
	@Order(1)
	void contextLoads() {
	}

	@Test
	@Order(2)
	void testDatabaseConnectionAndRoles() {
		long count = roleRepository.count();
		assertTrue(count >= 9, "Co so du lieu phai co toi thieu 9 vai tro");
		assertTrue(roleRepository.findByCode("doctor").isPresent(), "Vai tro doctor phai ton tai");
		assertTrue(roleRepository.findByCode("patient").isPresent(), "Vai tro patient phai ton tai");
		assertTrue(roleRepository.findByCode("admin").isPresent(), "Vai tro admin phai ton tai");
	}

	@Test
	@Order(3)
	void testWebControllerRoutes() {
		WebController controller = new WebController();
		assertEquals("forward:/index.html", controller.forwardToSpa());
		assertEquals("forward:/index.html", controller.index());
		assertEquals("forward:/index.html", controller.about());
		assertEquals("forward:/index.html", controller.contact());
		assertEquals("forward:/index.html", controller.services());
	}

	// UC-TK01: Dang nhap
	@Test
	@Order(4)
	void testUcTk01Login() {
		// Test successful login with admin / 123456
		LoginRequest request = new LoginRequest("admin", "123456");
		LoginResponse response = authService.login(request, "127.0.0.1");
		assertTrue(response.isSuccess(), "Dang nhap tai khoan admin phai thanh cong");
		assertNotNull(response.getToken(), "Token dang nhap phai duoc tao");
		assertNotNull(response.getUser(), "Thong tin nguoi dung phai duoc tra ve");
		assertTrue(response.getUser().getRoles().contains("admin"), "Admin phai co vai tro admin");

		// Test invalid password
		LoginRequest wrongReq = new LoginRequest("admin", "wrong_password");
		LoginResponse wrongRes = authService.login(wrongReq, "127.0.0.1");
		assertFalse(wrongRes.isSuccess(), "Mat khau sai phai bao loi");
	}

	// Dang ky tai khoan benh nhan
	@Test
	@Order(5)
	void testPatientRegistration() {
		String testUser = "patient_new_" + System.currentTimeMillis();
		String testPhone = "09" + (int)(Math.random() * 90000000 + 10000000);
		RegisterRequest req = new RegisterRequest(testUser, "password123", "password123", testUser + "@gmail.com", testPhone);

		LoginResponse res = authService.register(req, "127.0.0.1");
		assertTrue(res.isSuccess(), "Dang ky benh nhan phai thanh cong");
		assertNotNull(res.getToken(), "Token dang nhap phai duoc cap ngay sau khi dang ky");
		assertNotNull(res.getUser(), "Thong tin nguoi dung phai duoc tra ve");
		assertTrue(res.getUser().getRoles().contains("patient"), "Vai tro mac dinh phai la patient");

		// Test password mismatch
		RegisterRequest mismatchReq = new RegisterRequest("mismatch_u", "password123", "different_pass", null, "0988000111");
		LoginResponse mismatchRes = authService.register(mismatchReq, "127.0.0.1");
		assertFalse(mismatchRes.isSuccess(), "Xac nhan mat khau khong khop phai bao loi");

		// Test duplicate username
		RegisterRequest dupReq = new RegisterRequest("admin", "password123", "password123", null, "0988000222");
		LoginResponse dupRes = authService.register(dupReq, "127.0.0.1");
		assertFalse(dupRes.isSuccess(), "Ten dang nhap da ton tai phai bao loi");
	}

	// UC-TK02: Dang xuat
	@Test
	@Order(6)
	void testUcTk02Logout() {
		boolean loggedOut = authService.logout(1L, "127.0.0.1");
		assertTrue(loggedOut, "Dang xuat phai thanh cong va ghi nhan audit log");
	}

	// UC-TK03: Doi mat khau
	@Test
	@Order(6)
	void testUcTk03ChangePassword() {
		// Change password for user 9 (patient_nam)
		ChangePasswordRequest request = new ChangePasswordRequest();
		request.setUserId(9L);
		request.setCurrentPassword("123456");
		request.setNewPassword("newpass123");
		request.setConfirmPassword("newpass123");

		String result = authService.changePassword(request, "127.0.0.1");
		assertEquals("SUCCESS", result, "Doi mat khau hop le phai thanh cong");

		// Revert back to 123456 for idempotency
		request.setCurrentPassword("newpass123");
		request.setNewPassword("123456");
		request.setConfirmPassword("123456");
		authService.changePassword(request, "127.0.0.1");
	}

	// UC-TK04: Quen va dat lai mat khau
	@Test
	@Order(7)
	void testUcTk04ForgotAndResetPassword() {
		ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
		forgotReq.setEmailOrPhone("bn.nam@gmail.com");

		String token = authService.forgotPassword(forgotReq, "127.0.0.1");
		assertNotNull(token, "Token quen mat khau phai duoc sinh ra");
		assertEquals(8, token.length(), "Do dai token la 8 ky tu");

		ResetPasswordRequest resetReq = new ResetPasswordRequest();
		resetReq.setToken(token);
		resetReq.setNewPassword("newpass456");
		resetReq.setConfirmPassword("newpass456");

		String resetResult = authService.resetPassword(resetReq, "127.0.0.1");
		assertEquals("SUCCESS", resetResult, "Dat lai mat khau voi token hop le phai thanh cong");

		// Reset back to 123456
		ForgotPasswordRequest forgotReq2 = new ForgotPasswordRequest();
		forgotReq2.setEmailOrPhone("bn.nam@gmail.com");
		String token2 = authService.forgotPassword(forgotReq2, "127.0.0.1");
		resetReq.setToken(token2);
		resetReq.setNewPassword("123456");
		resetReq.setConfirmPassword("123456");
		authService.resetPassword(resetReq, "127.0.0.1");
	}

	// UC-TK05: Quan ly tai khoan (tao, khoa, mo khoa)
	@Test
	@Order(8)
	void testUcTk05AccountManagement() {
		// Verify non-admin/manager cannot create account
		CreateAccountRequest unauthorizedReq = new CreateAccountRequest();
		unauthorizedReq.setUsername("unauth_user");
		assertThrows(SecurityException.class, () -> {
			accountManagementService.createAccount(unauthorizedReq, 9L, "127.0.0.1"); // user 9 is patient
		}, "Benh nhan khong duoc phep tao tai khoan");

		// Verify manager (user 2) can view accounts
		assertDoesNotThrow(() -> accountManagementService.getAllAccounts(2L), "Manager co the xem danh sach tai khoan");

		String testUsername = "test_user_" + System.currentTimeMillis();
		CreateAccountRequest createReq = new CreateAccountRequest();
		createReq.setUsername(testUsername);
		createReq.setPassword("password123");
		createReq.setEmail(testUsername + "@testclinic.vn");
		createReq.setPhone("09" + (int)(Math.random() * 90000000 + 10000000));
		createReq.setRoleCodes(Set.of("patient"));

		UserSummary created = accountManagementService.createAccount(createReq, 1L, "127.0.0.1");
		assertNotNull(created.getId(), "Tai khoan moi tao phai co ID");
		assertTrue(created.getIsActive(), "Tai khoan moi tao phai o trang thai active");

		// Test lock account
		UserSummary locked = accountManagementService.toggleAccountStatus(created.getId(), false, "Vi pham quy che", 1L, "127.0.0.1");
		assertFalse(locked.getIsActive(), "Tai khoan phai bi khoa");

		// Verify locked user cannot login
		LoginResponse loginRes = authService.login(new LoginRequest(testUsername, "password123"), "127.0.0.1");
		assertFalse(loginRes.isSuccess(), "Tai khoan bi khoa khong duoc phep dang nhap");

		// Verify manager (user 2) cannot lock admin (user 1)
		IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () -> {
			accountManagementService.toggleAccountStatus(1L, false, "Thu khoa admin", 2L, "127.0.0.1");
		});
		assertTrue(ex1.getMessage().contains("Quản lý không có quyền khóa tài khoản của Quản trị viên"));

		// Verify manager (user 2) cannot lock themselves
		IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () -> {
			accountManagementService.toggleAccountStatus(2L, false, "Thu tu khoa", 2L, "127.0.0.1");
		});
		assertTrue(ex2.getMessage().contains("Bạn không thể tự khóa tài khoản"));

		// Verify admin (user 1) cannot self-lock
		assertThrows(IllegalArgumentException.class, () -> {
			accountManagementService.toggleAccountStatus(1L, false, "Thu tu khoa admin", 1L, "127.0.0.1");
		});

		// Test unlock account
		UserSummary unlocked = accountManagementService.toggleAccountStatus(created.getId(), true, "Da xac minh mo lai", 1L, "127.0.0.1");
		assertTrue(unlocked.getIsActive(), "Tai khoan phai duoc mo khoa thanh cong");
	}

	// UC-TK06: Phan quyen, gan vai tro
	@Test
	@Order(9)
	void testUcTk06RoleAndPermissionAssignment() {
		List<Role> roles = rolePermissionService.getAllRoles();
		assertFalse(roles.isEmpty(), "Danh sach vai tro khong duoc rong");

		// Verify non-admin/manager cannot assign roles
		assertThrows(SecurityException.class, () -> {
			rolePermissionService.assignRolesToUser(9L, Set.of("doctor"), 9L, "127.0.0.1");
		}, "Benh nhan khong duoc phep gan vai tro");

		// Manager (user 2) or Admin (user 1) can assign roles
		UserSummary userSummary = rolePermissionService.assignRolesToUser(9L, Set.of("patient", "receptionist"), 2L, "127.0.0.1");
		assertTrue(userSummary.getRoles().contains("receptionist"), "Manager co the gan vai tro moi cho nguoi dung");

		// Revert role to patient
		rolePermissionService.assignRolesToUser(9L, Set.of("patient"), 1L, "127.0.0.1");
	}

	// UC-TK07: Xem nhat ky truy cap ho so
	@Test
	@Order(10)
	void testUcTk07MedicalRecordAccessLogs() {
		// Log an access event
		RecordAccessLogRequest request = new RecordAccessLogRequest();
		request.setUserId(4L);
		request.setAction("VIEW_RECORD");
		request.setRecordCode("HSBA-2026-TEST");
		request.setPatientName("Nguyen Van Test");
		request.setReason("Hoi chan ca benh phuc tap");

		MedicalRecordAccessLogResponse logged = recordAccessLogService.logRecordAccess(request, "192.168.1.150");
		assertNotNull(logged.getId(), "Ban ghi audit log phai duoc luu");

		// Verify patient cannot view access logs
		assertThrows(SecurityException.class, () -> {
			recordAccessLogService.getMedicalRecordAccessLogs(9L);
		}, "Benh nhan khong duoc phep xem nhat ky truy cap ho so");

		// Manager (user 2) and Admin (user 1) can view access logs
		List<MedicalRecordAccessLogResponse> managerLogs = recordAccessLogService.getMedicalRecordAccessLogs(2L);
		assertFalse(managerLogs.isEmpty(), "Manager co the xem danh sach nhat ky truy cap ho so");
		assertTrue(managerLogs.stream().anyMatch(l -> "HSBA-2026-TEST".equals(l.getRecordCode())),
				"Nhat ky vua tao phai xuat hien trong danh sach");
	}

	@Autowired
	private PatientManagementService patientManagementService;

	// UC-BN01: Dang ky ho so benh nhan moi (Le tan / Benh nhan)
	@Test
	@Order(11)
	void testUcBn01CreatePatient() {
		com.clinic.clinic_management.dto.PatientDtos.CreatePatientRequest req = new com.clinic.clinic_management.dto.PatientDtos.CreatePatientRequest();
		String phone = "0977" + (int)(Math.random() * 900000 + 100000);
		req.setFullName("Tran Thi Mai Hoa");
		req.setGender("FEMALE");
		req.setDateOfBirth(java.time.LocalDate.of(1995, 5, 20));
		req.setPhone(phone);
		req.setEmail("hoa.tran@example.com");
		req.setIdentityCard("001195" + (int)(Math.random() * 900000 + 100000));
		req.setHealthInsuranceNumber("GD40195" + (int)(Math.random() * 9000000 + 1000000));
		req.setAddress("Cau Giay, Ha Noi");
		req.setBloodGroup("A+");

		// Receptionist creates patient
		var created = patientManagementService.createPatient(req, 3L, "127.0.0.1");
		assertNotNull(created.getId(), "Ho so benh nhan phai co ID");
		assertNotNull(created.getPatientCode(), "Ma ho so phai duoc tu dong tao");
		assertTrue(created.getPatientCode().startsWith("BN"), "Ma ho so bat dau bang BN");
		assertEquals("Tran Thi Mai Hoa", created.getFullName());
		assertEquals("A+", created.getBloodGroup());
		assertTrue(created.getIsActive(), "Ho so tao moi mac dinh phai kich hoat");

		// Duplicate phone throws error
		assertThrows(IllegalArgumentException.class, () -> {
			patientManagementService.createPatient(req, 3L, "127.0.0.1");
		}, "Trung so dien thoai phai bao loi de phong ngua trung lap");
	}

	// UC-BN02: Tim kiem benh nhan theo ten, so dien thoai, ma ho so
	@Test
	@Order(12)
	void testUcBn02SearchPatients() {
		// Doctor searches by existing patient name
		var results = patientManagementService.searchPatients("Nam", true, 4L);
		assertFalse(results.isEmpty(), "Bac si phai tim thay benh nhan ten Nam");
		assertTrue(results.stream().anyMatch(p -> p.getPatientCode().equals("BN20260001")));

		// Search by phone
		var phoneResults = patientManagementService.searchPatients("0988777666", true, 3L);
		assertFalse(phoneResults.isEmpty(), "Le tan phai tim thay benh nhan theo so dien thoai");

		// Non-staff user cannot perform general patient search
		assertThrows(SecurityException.class, () -> {
			patientManagementService.searchPatients("Nam", true, 9L);
		}, "Benh nhan khong duoc phep tim kiem danh sach toan bo benh nhan");
	}

	// UC-BN03: Cap nhat thong tin hanh chinh benh nhan (Le tan)
	@Test
	@Order(13)
	void testUcBn03UpdatePatient() {
		com.clinic.clinic_management.dto.PatientDtos.UpdatePatientRequest req = new com.clinic.clinic_management.dto.PatientDtos.UpdatePatientRequest();
		req.setFullName("Nguyen Hoai Nam (Cap nhat)");
		req.setGender("MALE");
		req.setDateOfBirth(java.time.LocalDate.of(1990, 8, 14));
		req.setPhone("0988777666");
		req.setAddress("So 100 Thai Ha, Dong Da, Ha Noi");
		req.setEmergencyContactName("Nguyen Van A");
		req.setEmergencyContactPhone("0912345678");

		// Receptionist updates
		var updated = patientManagementService.updatePatient(1L, req, 3L, "127.0.0.1");
		assertEquals("Nguyen Hoai Nam (Cap nhat)", updated.getFullName());
		assertEquals("So 100 Thai Ha, Dong Da, Ha Noi", updated.getAddress());
		assertEquals("Nguyen Van A", updated.getEmergencyContactName());

		// Patient user is not allowed to perform receptionist administrative update
		assertThrows(SecurityException.class, () -> {
			patientManagementService.updatePatient(1L, req, 9L, "127.0.0.1");
		}, "Benh nhan khong the tu y thuc hien chuc nang cap nhat hanh chinh cua Le tan");
	}

	// UC-BN04: Quan ly tien su benh va di ung (Bac si)
	@Test
	@Order(14)
	void testUcBn04UpdateMedicalHistory() {
		com.clinic.clinic_management.dto.PatientDtos.UpdateMedicalHistoryRequest req = new com.clinic.clinic_management.dto.PatientDtos.UpdateMedicalHistoryRequest();
		req.setBloodGroup("O+");
		req.setMedicalHistory("Tang huyet ap do 1, da day HP duong tinh");
		req.setDrugAllergies("Di ung Penicillin gay man ngua nhe");

		// Doctor updates
		var updated = patientManagementService.updateMedicalHistory(1L, req, 4L, "127.0.0.1");
		assertEquals("O+", updated.getBloodGroup());
		assertEquals("Tang huyet ap do 1, da day HP duong tinh", updated.getMedicalHistory());
		assertEquals("Di ung Penicillin gay man ngua nhe", updated.getDrugAllergies());

		// Receptionist is blocked from updating clinical medical history
		assertThrows(SecurityException.class, () -> {
			patientManagementService.updateMedicalHistory(1L, req, 3L, "127.0.0.1");
		}, "Le tan khong co chuyen mon bac si de sua tien su benh va di ung");
	}

	// UC-BN05: Cap nhat thong tin bao hiem y te (Le tan)
	@Test
	@Order(15)
	void testUcBn05UpdateInsurance() {
		com.clinic.clinic_management.dto.PatientDtos.UpdateInsuranceRequest req = new com.clinic.clinic_management.dto.PatientDtos.UpdateInsuranceRequest();
		req.setHealthInsuranceNumber("DN4019998887776");

		// Receptionist updates
		var updated = patientManagementService.updateInsurance(1L, req, 3L, "127.0.0.1");
		assertEquals("DN4019998887776", updated.getHealthInsuranceNumber());

		// Patient is blocked from receptionist insurance update
		assertThrows(SecurityException.class, () -> {
			patientManagementService.updateInsurance(1L, req, 9L, "127.0.0.1");
		}, "Benh nhan khong co quyen le tan de sua the BHYT");
	}

	// UC-BN06: Xem lich su kham benh
	@Test
	@Order(16)
	void testUcBn06MedicalRecords() {
		// Doctor views records of patient 1
		var records = patientManagementService.getPatientMedicalRecords(1L, 4L);
		var target = records.stream().filter(r -> "BA20261031001".equals(r.getRecordCode())).findFirst().orElse(records.get(0));
		assertNotNull(target, "Phải tìm thấy hồ sơ bệnh án");
		assertNotNull(target.getDoctorName(), "Ten bac si phai duoc hien thi");
		assertNotNull(target.getRoomName(), "Ten phong kham phai duoc hien thi");

		// Patient 1 (userId 9) can view their own medical records
		var patientRecords = patientManagementService.getPatientMedicalRecords(1L, 9L);
		assertFalse(patientRecords.isEmpty(), "Benh nhan phai xem duoc ho so cua chinh minh");
	}

	// UC-BN07: Gop ho so trung / vo hieu hoa ho so (Quan ly)
	@Test
	@Order(17)
	void testUcBn07MergeAndTogglePatient() {
		// Create a duplicate test patient
		com.clinic.clinic_management.dto.PatientDtos.CreatePatientRequest dupReq = new com.clinic.clinic_management.dto.PatientDtos.CreatePatientRequest();
		String phoneDup = "0966" + (int)(Math.random() * 900000 + 100000);
		dupReq.setFullName("Nguyen Hoai Nam (Ho so trung)");
		dupReq.setGender("MALE");
		dupReq.setDateOfBirth(java.time.LocalDate.of(1990, 8, 14));
		dupReq.setPhone(phoneDup);
		var dupPatient = patientManagementService.createPatient(dupReq, 3L, "127.0.0.1");

		// Receptionist cannot merge duplicate patients
		com.clinic.clinic_management.dto.PatientDtos.MergePatientRequest mergeReq = new com.clinic.clinic_management.dto.PatientDtos.MergePatientRequest();
		mergeReq.setPrimaryPatientId(1L);
		mergeReq.setDuplicatePatientId(dupPatient.getId());
		mergeReq.setNote("Gop ho so tao trung lap do le tan truoc");

		assertThrows(SecurityException.class, () -> {
			patientManagementService.mergePatients(mergeReq, 3L, "127.0.0.1");
		}, "Le tan khong co tham quyen gop ho so benh nhan");

		// Manager (user 2) merges duplicate patient into primary patient (1)
		var merged = patientManagementService.mergePatients(mergeReq, 2L, "127.0.0.1");
		assertNotNull(merged);
		assertEquals(1L, merged.getId());

		// Verify duplicate patient is now deactivated and points to primary
		var fetchedDup = patientManagementService.getPatientById(dupPatient.getId(), 2L);
		assertFalse(fetchedDup.getIsActive(), "Ho so trung phai bi vo hieu hoa sau khi gop");
		assertEquals(1L, fetchedDup.getMergedIntoId(), "mergedIntoId phai tro ve ho so goc");

		// Test toggle active status by Manager
		com.clinic.clinic_management.dto.PatientDtos.ToggleActiveRequest toggleReq = new com.clinic.clinic_management.dto.PatientDtos.ToggleActiveRequest();
		toggleReq.setIsActive(false);
		toggleReq.setReason("Tam dung ho so de kiem tra thong tin");
		var toggled = patientManagementService.togglePatientActive(1L, toggleReq, 2L, "127.0.0.1");
		assertFalse(toggled.getIsActive(), "Ho so goc da bi tam dung");

		// Reactivate
		toggleReq.setIsActive(true);
		toggleReq.setReason("Mo lai ho so sau khi xac minh xong");
		var reactivated = patientManagementService.togglePatientActive(1L, toggleReq, 2L, "127.0.0.1");
		assertTrue(reactivated.getIsActive(), "Ho so goc da duoc mo lai");
	}

	// =========================================================================
	// PHAN HE 3.3: NHAN SU VA LICH LAM VIEC (7 UC)
	// =========================================================================

	// UC-NS01: Them ho so nhan vien (Quan ly)
	@Test
	@Order(18)
	void testUcNs01CreateStaff() {
		com.clinic.clinic_management.dto.StaffSchedulingDtos.StaffCreateRequest req = new com.clinic.clinic_management.dto.StaffSchedulingDtos.StaffCreateRequest();
		String randUser = "dr_huong_" + (int)(Math.random() * 90000 + 10000);
		req.username = randUser;
		req.password = "123456";
		req.email = randUser + "@careplusclinic.vn";
		req.phone = "0977" + (int)(Math.random() * 900000 + 100000);
		req.roleCode = "doctor";
		req.fullName = "BS.CKI Le Thi Thu Huong";
		req.gender = "FEMALE";
		req.dateOfBirth = java.time.LocalDate.of(1985, 4, 12);
		req.idCardNumber = "00108500" + (int)(Math.random() * 9000 + 1000);
		req.address = "Pho Hue, Hai Ba Trung, Ha Noi";
		req.qualification = "Bac si Chuyen khoa I Nhi";
		req.departmentId = 2L;
		req.specialty = "Nhi khoa tong quat & Dinh duong";
		req.licenseNumber = "CCHN_" + (int)(Math.random() * 900000 + 100000) + "/HN";
		req.yearsOfExperience = 12;

		// Receptionist cannot create staff
		assertThrows(SecurityException.class, () -> {
			staffSchedulingService.createStaff(req, 3L, "127.0.0.1");
		}, "Le tan khong co quyen them ho so nhan su");

		// Manager (user 2) creates staff
		var created = staffSchedulingService.createStaff(req, 2L, "127.0.0.1");
		assertNotNull(created);
		assertNotNull(created.id);
		assertEquals("BS.CKI Le Thi Thu Huong", created.fullName);
		assertEquals("ACTIVE", created.status);
		assertEquals("Nhi khoa tong quat & Dinh duong", created.specialty);
	}

	// UC-NS02: Cap nhat / cho nghi viec nhan vien (Quan ly)
	@Test
	@Order(19)
	void testUcNs02UpdateAndResignStaff() {
		// Get staff 2 (BS An)
		var staff = staffSchedulingService.getStaffById(2L);
		assertNotNull(staff);

		com.clinic.clinic_management.dto.StaffSchedulingDtos.StaffUpdateRequest upReq = new com.clinic.clinic_management.dto.StaffSchedulingDtos.StaffUpdateRequest();
		upReq.fullName = "BS.CKII Nguyen Minh An (Cap nhat)";
		upReq.qualification = "Bac si Chuyen khoa II Noi Tim Mach";
		upReq.address = "Quan Dong Da, Ha Noi";
		upReq.specialty = "Noi tim mach va huyet ap";

		// Update by Manager
		var updated = staffSchedulingService.updateStaff(2L, upReq, 2L, "127.0.0.1");
		assertEquals("BS.CKII Nguyen Minh An (Cap nhat)", updated.fullName);

		// Test status change: Resign
		com.clinic.clinic_management.dto.StaffSchedulingDtos.StaffStatusRequest statusReq = new com.clinic.clinic_management.dto.StaffSchedulingDtos.StaffStatusRequest();
		statusReq.status = "RESIGNED";
		statusReq.reason = "Nghi huong che do huu tri";

		var resigned = staffSchedulingService.changeStaffStatus(2L, statusReq, 2L, "127.0.0.1");
		assertEquals("RESIGNED", resigned.status);

		// Restore to ACTIVE for continuing operations
		statusReq.status = "ACTIVE";
		statusReq.reason = "Tiep tuc cong tac chuyen gia";
		var restored = staffSchedulingService.changeStaffStatus(2L, statusReq, 2L, "127.0.0.1");
		assertEquals("ACTIVE", restored.status);
	}

	// UC-NS03: Quan ly chuyen khoa va phong kham (Quan ly)
	@Test
	@Order(20)
	void testUcNs03DepartmentAndClinicRoom() {
		// Create department
		com.clinic.clinic_management.dto.StaffSchedulingDtos.DepartmentRequest deptReq = new com.clinic.clinic_management.dto.StaffSchedulingDtos.DepartmentRequest();
		String deptCode = "K_MAT_" + (int)(Math.random() * 900 + 100);
		deptReq.code = deptCode;
		deptReq.name = "Khoa Mat & Khuc Xa";
		deptReq.location = "Tang 3 - Khu A";
		deptReq.description = "Kham va do thi luc chuyen sau";

		var dept = staffSchedulingService.createDepartment(deptReq, 2L, "127.0.0.1");
		assertNotNull(dept);
		assertEquals(deptCode, dept.code);

		// Create clinic room in this department
		com.clinic.clinic_management.dto.StaffSchedulingDtos.ClinicRoomRequest roomReq = new com.clinic.clinic_management.dto.StaffSchedulingDtos.ClinicRoomRequest();
		String roomNum = "P" + (int)(Math.random() * 90000 + 10000);
		roomReq.departmentId = dept.id;
		roomReq.roomNumber = roomNum;
		roomReq.name = "Phong Kham Mat Chuyen Khoa";
		roomReq.roomType = "EXAMINATION";

		var room = staffSchedulingService.createRoom(roomReq, 2L, "127.0.0.1");
		assertNotNull(room);
		assertEquals(roomNum, room.roomNumber);

		// Toggle room availability
		var toggled = staffSchedulingService.toggleRoomAvailability(room.id, 2L, "127.0.0.1");
		assertFalse(toggled.isAvailable);

		// Toggle back
		var reEnabled = staffSchedulingService.toggleRoomAvailability(room.id, 2L, "127.0.0.1");
		assertTrue(reEnabled.isAvailable);
	}

	// UC-NS04: Phan lich lam viec cho bac si (Quan ly)
	@Test
	@Order(21)
	void testUcNs04ScheduleDoctor() {
		com.clinic.clinic_management.dto.StaffSchedulingDtos.ScheduleCreateRequest req = new com.clinic.clinic_management.dto.StaffSchedulingDtos.ScheduleCreateRequest();
		req.staffId = 2L; // Doctor An
		req.shiftId = 1L; // Morning
		req.roomId = 1L; // P101
		req.workDate = java.time.LocalDate.now().plusDays(20);
		req.note = "Truc phong kham Noi 1 ca sang";

		staffScheduleRepository.findByStaffIdAndShiftIdAndWorkDate(req.staffId, req.shiftId, req.workDate)
				.ifPresent(existing -> staffScheduleRepository.delete(existing));

		// Create schedule by Manager
		var schedule = staffSchedulingService.createSchedule(req, 2L, "127.0.0.1");
		assertNotNull(schedule);
		assertEquals(2L, schedule.staffId);
		assertEquals("SCHEDULED", schedule.status);

		// Duplicate schedule in same shift should be rejected
		assertThrows(IllegalArgumentException.class, () -> {
			staffSchedulingService.createSchedule(req, 2L, "127.0.0.1");
		}, "Khong duoc xep trung ca cho mot nhan su");
	}

	// UC-NS05: Xem lich lam viec (Bac si, Le tan, Quan ly)
	@Test
	@Order(22)
	void testUcNs05ViewSchedules() {
		java.time.LocalDate start = java.time.LocalDate.now().minusDays(1);
		java.time.LocalDate end = java.time.LocalDate.now().plusDays(10);

		// Get all clinic schedules (Receptionist and Manager can filter by department / date)
		var allSchedules = staffSchedulingService.getSchedules(start, end, null, null, null);
		assertNotNull(allSchedules);
		assertFalse(allSchedules.isEmpty(), "Danh sach lich lam viec khong duoc rong");

		// Filter by doctor (Doctor An)
		var doctorSchedules = staffSchedulingService.getSchedules(start, end, null, 2L, null);
		assertNotNull(doctorSchedules);
		assertTrue(doctorSchedules.stream().allMatch(s -> s.staffId.equals(2L)));
	}

	// UC-NS06: Dang ky nghi / doi ca (Bac si yeu cau - Quan ly duyet)
	@Test
	@Order(23)
	void testUcNs06LeaveAndSwapRequest() {
		// Doctor An (userId = 4) requests leave
		com.clinic.clinic_management.dto.StaffSchedulingDtos.LeaveSwapCreateRequest req = new com.clinic.clinic_management.dto.StaffSchedulingDtos.LeaveSwapCreateRequest();
		req.requestType = "LEAVE";
		req.leaveDate = java.time.LocalDate.now().plusDays(5);
		req.reason = "Tham gia hoi thao tim mach quoc te tai TP.HCM";

		var createdReq = staffSchedulingService.createLeaveSwapRequest(req, 4L, "127.0.0.1");
		assertNotNull(createdReq);
		assertEquals("PENDING", createdReq.status);

		// Manager reviews and approves
		com.clinic.clinic_management.dto.StaffSchedulingDtos.LeaveSwapReviewRequest review = new com.clinic.clinic_management.dto.StaffSchedulingDtos.LeaveSwapReviewRequest();
		review.status = "APPROVED";
		review.reviewNote = "Dong y cap phep tham du hoi thao khoa hoc";

		var reviewed = staffSchedulingService.reviewLeaveSwapRequest(createdReq.id, review, 2L, "127.0.0.1");
		assertEquals("APPROVED", reviewed.status);
		assertEquals("Dong y cap phep tham du hoi thao khoa hoc", reviewed.reviewNote);
	}

	// UC-NS07: Cham cong (Nhan vien)
	@Test
	@Order(24)
	void testUcNs07AttendanceCheckInCheckOut() {
		// Staff (userId = 4 - Doctor An) performs check-in
		com.clinic.clinic_management.dto.StaffSchedulingDtos.AttendanceCheckInRequest checkInReq = new com.clinic.clinic_management.dto.StaffSchedulingDtos.AttendanceCheckInRequest();
		checkInReq.notes = "Diem danh vao ca truc bang ung dung phong kham";

		var checkIn = staffSchedulingService.checkIn(4L, checkInReq, "127.0.0.1");
		assertNotNull(checkIn);
		assertNotNull(checkIn.checkInTime);
		assertNotNull(checkIn.status);

		// Staff performs check-out
		com.clinic.clinic_management.dto.StaffSchedulingDtos.AttendanceCheckOutRequest checkOutReq = new com.clinic.clinic_management.dto.StaffSchedulingDtos.AttendanceCheckOutRequest();
		checkOutReq.notes = "Ket thuc ca kham benh trong ngay";

		var checkOut = staffSchedulingService.checkOut(4L, checkOutReq, "127.0.0.1");
		assertNotNull(checkOut.checkOutTime);

		// Check attendance history
		var history = staffSchedulingService.getMyAttendance(4L, java.time.LocalDate.now().minusDays(5), java.time.LocalDate.now());
		assertFalse(history.isEmpty());
	}

	// =========================================================================
	// PHAN HE 3.4: DAT LICH HEN (8 UC: UC-LH01 -> UC-LH08)
	// =========================================================================

	// UC-LH01: Xem khung gio trong cua bac si (Benh nhan, Le tan)
	@Test
	@Order(25)
	void testUcLh01GetDoctorSlots() {
		java.time.LocalDate targetDate = java.time.LocalDate.now().plusDays(2);
		var slotsSummary = appointmentService.getDoctorAvailableSlots(2L, targetDate);
		assertNotNull(slotsSummary);
		assertEquals(2L, slotsSummary.getDoctorId());
		assertNotNull(slotsSummary.getDoctorName());
		assertFalse(slotsSummary.getSlots().isEmpty());

		// Test getAvailableDoctors helper
		var doctors = appointmentService.getAvailableDoctors(targetDate, null);
		assertFalse(doctors.isEmpty());
	}

	// UC-LH02: Dat lich hen (Benh nhan, Le tan)
	@Test
	@Order(26)
	void testUcLh02BookAppointment() {
		java.time.LocalDate date = java.time.LocalDate.now().plusDays(3);
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, date)
				.forEach(appointmentRepository::delete);

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest req = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setAppointmentDate(date);
		req.setAppointmentTime(java.time.LocalTime.of(8, 30));
		req.setSymptomsSummary("Dau dau chong mat, nghi tang huyet ap");
		req.setBookingChannel("ONLINE_PORTAL");
		req.setNotes("Dat hen qua cong thong tin benh nhan");

		var booked = appointmentService.bookAppointment(req, 1L);
		assertNotNull(booked);
		assertNotNull(booked.getAppointmentCode());
		assertTrue(booked.getAppointmentCode().startsWith("LH-"));
		assertEquals("PENDING", booked.getStatus());
		assertEquals(2L, booked.getDoctorId());
		assertFalse(booked.getReminders().isEmpty()); // Auto generated reminder UC-LH06
	}

	// UC-LH03: Xac nhan lich hen (Le tan)
	@Test
	@Order(27)
	void testUcLh03ConfirmAppointment() {
		java.time.LocalDate date = java.time.LocalDate.now().plusDays(4);
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, date)
				.forEach(appointmentRepository::delete);

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest req = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setAppointmentDate(date);
		req.setAppointmentTime(java.time.LocalTime.of(9, 0));
		req.setSymptomsSummary("Kham tong quat dinh ky");
		req.setBookingChannel("ONLINE_PORTAL");

		var booked = appointmentService.bookAppointment(req, 1L);

		// Receptionist confirms
		com.clinic.clinic_management.dto.AppointmentDtos.ConfirmAppointmentRequest confirmReq = new com.clinic.clinic_management.dto.AppointmentDtos.ConfirmAppointmentRequest();
		confirmReq.setNotes("Da goi dien thoai xac nhan voi benh nhan");

		var confirmed = appointmentService.confirmAppointment(booked.getId(), confirmReq, 3L);
		assertEquals("CONFIRMED", confirmed.getStatus());
		assertTrue(confirmed.getNotes().contains("Da goi dien thoai xac nhan voi benh nhan"));
	}

	// UC-LH04: Doi gio lich hen (Benh nhan, Le tan)
	@Test
	@Order(28)
	void testUcLh04RescheduleAppointment() {
		java.time.LocalDate date = java.time.LocalDate.now().plusDays(5);
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, date)
				.forEach(appointmentRepository::delete);

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest req = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setAppointmentDate(date);
		req.setAppointmentTime(java.time.LocalTime.of(10, 0));
		req.setSymptomsSummary("Theo doi ket qua dieu tri");

		var booked = appointmentService.bookAppointment(req, 1L);

		// Reschedule to 14:00
		com.clinic.clinic_management.dto.AppointmentDtos.RescheduleAppointmentRequest rescheduleReq = new com.clinic.clinic_management.dto.AppointmentDtos.RescheduleAppointmentRequest();
		rescheduleReq.setNewDate(date);
		rescheduleReq.setNewTime(java.time.LocalTime.of(14, 0));
		rescheduleReq.setReason("Ban cong viec dot xuat buoi sang");

		var updated = appointmentService.rescheduleAppointment(booked.getId(), rescheduleReq, 1L);
		assertEquals(java.time.LocalTime.of(14, 0), updated.getAppointmentTime());
		assertTrue(updated.getNotes().contains("Ban cong viec dot xuat buoi sang"));
	}

	// UC-LH05: Huy lich hen (Benh nhan, Le tan)
	@Test
	@Order(29)
	void testUcLh05CancelAppointment() {
		java.time.LocalDate date = java.time.LocalDate.now().plusDays(6);
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, date)
				.forEach(appointmentRepository::delete);

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest req = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setAppointmentDate(date);
		req.setAppointmentTime(java.time.LocalTime.of(15, 0));
		req.setSymptomsSummary("Kham suc khoe di lam");

		var booked = appointmentService.bookAppointment(req, 1L);

		// Cancel
		com.clinic.clinic_management.dto.AppointmentDtos.CancelAppointmentRequest cancelReq = new com.clinic.clinic_management.dto.AppointmentDtos.CancelAppointmentRequest();
		cancelReq.setReason("Benh nhan muon doi sang tuan sau");

		var cancelled = appointmentService.cancelAppointment(booked.getId(), cancelReq, 1L);
		assertEquals("CANCELLED", cancelled.getStatus());
		assertEquals("Benh nhan muon doi sang tuan sau", cancelled.getCancellationReason());
	}

	// UC-LH06: Gui nhac lich hen (SMS/email) (He thong, Le tan)
	@Test
	@Order(30)
	void testUcLh06SendReminder() {
		java.time.LocalDate date = java.time.LocalDate.now().plusDays(7);
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, date)
				.forEach(appointmentRepository::delete);

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest req = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setAppointmentDate(date);
		req.setAppointmentTime(java.time.LocalTime.of(8, 0));
		req.setSymptomsSummary("Kiem tra duong huyet");

		var booked = appointmentService.bookAppointment(req, 1L);

		// Send manual reminder via SMS
		com.clinic.clinic_management.dto.AppointmentDtos.SendReminderRequest reminderReq = new com.clinic.clinic_management.dto.AppointmentDtos.SendReminderRequest();
		reminderReq.setReminderType("SMS");
		reminderReq.setRecipient("0988777666");
		reminderReq.setTitle("Nhac lich kham");
		reminderReq.setContent("Kinh moi quy khach den dung gio hen 08:00 sang");

		var reminder = appointmentService.sendReminder(booked.getId(), reminderReq, 3L);
		assertNotNull(reminder);
		assertEquals("SMS", reminder.getReminderType());
		assertEquals("0988777666", reminder.getRecipient());

		// Verify reminder list
		var reminders = appointmentService.getRemindersByAppointmentId(booked.getId());
		assertFalse(reminders.isEmpty());
	}

	// UC-LH07: Xem danh sach lich hen trong ngay (Le tan, Bac si)
	@Test
	@Order(31)
	void testUcLh07GetAppointmentsAndStats() {
		java.time.LocalDate testDate = java.time.LocalDate.now().plusDays(8);
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, testDate)
				.forEach(appointmentRepository::delete);

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest req = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setAppointmentDate(testDate);
		req.setAppointmentTime(java.time.LocalTime.of(9, 30));
		req.setSymptomsSummary("Tai kham huyet ap");

		appointmentService.bookAppointment(req, 1L);

		// Get appointments on that date
		var list = appointmentService.getAppointments(testDate, 2L, null, null, null, null, null);
		assertFalse(list.isEmpty());

		// Get stats
		var stats = appointmentService.getAppointmentStats(testDate);
		assertNotNull(stats);
		assertTrue(stats.getTotal() >= 1);
	}

	// UC-LH08: Xu ly benh nhan khong den (no-show) (Le tan)
	@Test
	@Order(32)
	void testUcLh08MarkNoShow() {
		java.time.LocalDate date = java.time.LocalDate.now().plusDays(9);
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, date)
				.forEach(appointmentRepository::delete);

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest req = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setAppointmentDate(date);
		req.setAppointmentTime(java.time.LocalTime.of(16, 0));
		req.setSymptomsSummary("Kham da lieu");

		var booked = appointmentService.bookAppointment(req, 1L);

		// Mark no-show
		com.clinic.clinic_management.dto.AppointmentDtos.NoShowRequest noShowReq = new com.clinic.clinic_management.dto.AppointmentDtos.NoShowRequest();
		noShowReq.setReason("Qua gio hen 60 phut, goi dien khong lien lac duoc");

		var noShow = appointmentService.markNoShow(booked.getId(), noShowReq, 3L);
		assertEquals("CANCELLED", noShow.getStatus());
		assertTrue(noShow.getCancellationReason().contains("Qua gio hen 60 phut"));
		assertTrue(noShow.getCancellationReason().contains("No-Show"));

		// Yeu cau: Lich hen vang mat bi huy va tuyet doi khong cho phep doi gio
		com.clinic.clinic_management.dto.AppointmentDtos.RescheduleAppointmentRequest reschedReq = new com.clinic.clinic_management.dto.AppointmentDtos.RescheduleAppointmentRequest();
		reschedReq.setNewDate(date.plusDays(1));
		reschedReq.setNewTime(java.time.LocalTime.of(10, 0));
		assertThrows(IllegalArgumentException.class, () -> {
			appointmentService.rescheduleAppointment(booked.getId(), reschedReq, 3L);
		}, "Lich hen da huy do vang mat khong the doi gio");
	}

	// UC-TD01: Check-in benh nhan co lich hen (Le tan)
	@Test
	@Order(33)
	void testUcTd01CheckInAppointment() {
		java.time.LocalDate today = java.time.LocalDate.now();
		appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(2L, today)
				.forEach(app -> {
					queueTicketRepository.findByAppointmentId(app.getId()).ifPresent(queueTicketRepository::delete);
					appointmentRepository.delete(app);
				});

		com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest appReq = new com.clinic.clinic_management.dto.AppointmentDtos.CreateAppointmentRequest();
		appReq.setDoctorId(2L);
		appReq.setPatientId(1L);
		appReq.setAppointmentDate(today);
		appReq.setAppointmentTime(java.time.LocalTime.of(8, 30));
		appReq.setSymptomsSummary("Kham suc khoe dinh ky");

		var booked = appointmentService.bookAppointment(appReq, 1L);
		assertNotNull(booked);

		// Check-in
		com.clinic.clinic_management.dto.QueueDtos.CheckInAppointmentRequest checkInReq = new com.clinic.clinic_management.dto.QueueDtos.CheckInAppointmentRequest();
		checkInReq.setAppointmentId(booked.getId());
		checkInReq.setRoomId(1L); // P101
		checkInReq.setPriority("PRIORITY");
		checkInReq.setNotes("Benh nhan den dung gio");

		var ticket = queueService.checkInAppointment(checkInReq, 3L);
		assertNotNull(ticket);
		assertEquals("WAITING", ticket.getStatus());
		assertTrue(ticket.getAppointment());
		assertNotNull(ticket.getTicketCode());
		assertEquals(1L, ticket.getRoomId());

		// Verify appointment status updated to CHECKED_IN
		var checkedAppointment = appointmentService.getAppointmentById(booked.getId());
		assertEquals("CHECKED_IN", checkedAppointment.getStatus());
	}

	// UC-TD02: Tiep nhan benh nhan vang lai (Le tan)
	@Test
	@Order(34)
	void testUcTd02ReceptionWalkIn() {
		com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest walkInReq = new com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest();
		String randPhone = "09" + (int)(Math.random() * 90000000 + 10000000);
		walkInReq.setFullName("Benh Nhan Vang Lai Test");
		walkInReq.setPhone(randPhone);
		walkInReq.setDateOfBirth(java.time.LocalDate.of(1995, 5, 20));
		walkInReq.setGender("FEMALE");
		walkInReq.setRoomId(2L); // P102 Nhi
		walkInReq.setServiceType("Kham nhi tong quat");
		walkInReq.setPriority("NORMAL");
		walkInReq.setNotes("Sot nhe 2 ngay");

		var ticket = queueService.receptionWalkIn(walkInReq, 3L);
		assertNotNull(ticket);
		assertNotNull(ticket.getTicketCode());
		assertEquals(2L, ticket.getRoomId());
		assertFalse(ticket.getAppointment());
		assertEquals("WAITING", ticket.getStatus());
		assertEquals("Benh Nhan Vang Lai Test", ticket.getPatientName());
	}

	// UC-TD03: Cap so thu tu (Le tan, He thong)
	@Test
	@Order(35)
	void testUcTd03IssueTicketNumberIncrement() {
		com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest req1 = new com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest();
		req1.setFullName("BN Thu Tu 1");
		req1.setPhone("09" + (int)(Math.random() * 90000000 + 10000000));
		req1.setRoomId(1L);

		var t1 = queueService.receptionWalkIn(req1, 3L);

		com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest req2 = new com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest();
		req2.setFullName("BN Thu Tu 2");
		req2.setPhone("09" + (int)(Math.random() * 90000000 + 10000000));
		req2.setRoomId(1L);

		var t2 = queueService.receptionWalkIn(req2, 3L);

		assertTrue(t2.getTicketNumber() > t1.getTicketNumber(), "STT phai tang dan trong cung phong kham");
	}

	// UC-TD04: Xem hang cho theo phong kham (Le tan, Bac si, Dieu duong)
	@Test
	@Order(36)
	void testUcTd04ViewQueueAndOverview() {
		// View queue for room 1
		var queue = queueService.getQueueByRoom(1L, java.time.LocalDate.now(), null);
		assertNotNull(queue);

		// View overview for all rooms
		var overview = queueService.getRoomQueueOverview(java.time.LocalDate.now());
		assertNotNull(overview);
		assertFalse(overview.isEmpty());

		// View overall stats
		var stats = queueService.getQueueStats(java.time.LocalDate.now());
		assertNotNull(stats);
		assertTrue(stats.getTotalTickets() > 0);
	}

	// UC-TD05: Goi benh nhan vao kham (Bac si, Dieu duong)
	@Test
	@Order(37)
	void testUcTd05CallServeAndCompletePatient() {
		// Create a walk-in patient in room 1
		com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest req = new com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest();
		req.setFullName("Benh Nhan Cho Goi");
		req.setPhone("09" + (int)(Math.random() * 90000000 + 10000000));
		req.setRoomId(1L);
		var created = queueService.receptionWalkIn(req, 3L);

		// 1. Doctor / Nurse calls the patient
		var called = queueService.callNextPatient(1L, created.getId(), 2L);
		assertEquals("CALLED", called.getStatus());
		assertEquals(1, called.getCallCount());
		assertNotNull(called.getCalledAt());

		// 2. Doctor starts serving
		var serving = queueService.startServing(created.getId(), 2L);
		assertEquals("SERVING", serving.getStatus());
		assertNotNull(serving.getServingAt());

		// 3. Complete serving
		var completed = queueService.completeServing(created.getId(), 2L);
		assertEquals("COMPLETED", completed.getStatus());
		assertNotNull(completed.getCompletedAt());
	}

	// UC-TD06: Chuyen benh nhan sang phong/bac si khac (Le tan)
	@Test
	@Order(38)
	void testUcTd06TransferPatient() {
		// Create a waiting ticket in room 1
		com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest req = new com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest();
		req.setFullName("Benh Nhan Chuyen Phong");
		req.setPhone("09" + (int)(Math.random() * 90000000 + 10000000));
		req.setRoomId(1L);
		var created = queueService.receptionWalkIn(req, 3L);
		assertEquals(1L, created.getRoomId());

		// Transfer to room 2 (P102)
		com.clinic.clinic_management.dto.QueueDtos.TransferRoomRequest transferReq = new com.clinic.clinic_management.dto.QueueDtos.TransferRoomRequest();
		transferReq.setTargetRoomId(2L);
		transferReq.setReason("Dieu phoi sang phong nhi giam tai");

		var transferred = queueService.transferPatient(created.getId(), transferReq, 3L);
		assertNotNull(transferred);
		assertEquals(2L, transferred.getRoomId());
		assertEquals(1L, transferred.getTransferredFromRoomId());
		assertEquals("Dieu phoi sang phong nhi giam tai", transferred.getTransferReason());
		assertEquals("WAITING", transferred.getStatus());
	}

	// =========================================================================
	// PHÂN HỆ 3.6 KHÁM BỆNH (8 USE CASES)
	// =========================================================================

	// UC-KB01: Ghi nhận sinh hiệu (Điều dưỡng)
	@Test
	@Order(39)
	void testUcKb01RecordVitalSigns() {
		com.clinic.clinic_management.dto.MedicalExaminationDtos.VitalSignRequest req =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.VitalSignRequest();
		req.setPatientId(1L); // BN Nguyễn Hoài Nam
		req.setNurseId(4L);   // ĐD Trần Thị Lan (DD001)
		req.setTemperature(new java.math.BigDecimal("37.2"));
		req.setBloodPressureSystolic(120);
		req.setBloodPressureDiastolic(80);
		req.setHeartRate(76);
		req.setRespiratoryRate(18);
		req.setSpo2(new java.math.BigDecimal("99.0"));
		req.setWeightKg(new java.math.BigDecimal("65.5"));
		req.setHeightCm(new java.math.BigDecimal("170.0"));
		req.setNotes("Bệnh nhân tỉnh táo, tiếp xúc tốt, không khó thở");

		var res = medicalExaminationService.recordVitalSigns(req);
		assertNotNull(res);
		assertNotNull(res.getId());
		assertEquals(1L, res.getPatientId());
		assertEquals(new java.math.BigDecimal("22.7"), res.getBmi());
		assertEquals("Bình thường", res.getBmiCategory());
		assertEquals("Bình thường", res.getTemperatureStatus());

		// Lấy sinh hiệu mới nhất
		var latest = medicalExaminationService.getLatestVitalSigns(1L);
		assertTrue(latest.isPresent());
		assertEquals(res.getId(), latest.get().getId());
	}

	// UC-KB02: Xem bệnh án và lịch sử khám của bệnh nhân (Bác sĩ)
	@Test
	@Order(40)
	void testUcKb02ViewPatientMedicalHistory() {
		var history = medicalExaminationService.getPatientMedicalHistory(1L);
		assertNotNull(history);
		assertFalse(history.isEmpty(), "Bệnh nhân phải có lịch sử khám mẫu từ seed data");

		var firstRecord = history.get(0);
		assertNotNull(firstRecord.getRecordCode());
		assertEquals(1L, firstRecord.getPatientId());
		assertNotNull(firstRecord.getChiefComplaint());
	}

	// UC-KB03: Ghi triệu chứng và chẩn đoán (Bác sĩ)
	@Test
	@Order(41)
	void testUcKb03RecordSymptomsAndDiagnosis() {
		com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest req =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest();
		req.setPatientId(1L);
		req.setDoctorId(2L); // BS.CKII Nguyễn Minh An
		req.setRoomId(1L);   // P101
		req.setChiefComplaint("Đau mỏi vùng cổ gáy, thỉnh thoảng tê lan xuống ngón tay");
		req.setHistoryOfPresentIllness("Bệnh nhân làm việc văn phòng máy tính nhiều, triệu chứng kéo dài 1 tuần");
		req.setPhysicalExamination("Ấn đau điểm cạnh sống cổ C5-C6, Spurlings test nghi ngờ");
		req.setInitialDiagnosis("Theo dõi thoái hóa cột sống cổ / Chèn ép rễ");
		req.setIcd10Code("M47.8");
		req.setStatus("IN_PROGRESS");

		var savedRecord = medicalExaminationService.saveDiagnosis(req);
		assertNotNull(savedRecord);
		assertNotNull(savedRecord.getId());
		assertTrue(savedRecord.getRecordCode().startsWith("BA"));
		assertEquals("Đau mỏi vùng cổ gáy, thỉnh thoảng tê lan xuống ngón tay", savedRecord.getChiefComplaint());
		assertEquals("M47.8", savedRecord.getIcd10Code());
		assertEquals("IN_PROGRESS", savedRecord.getStatus());
	}

	// UC-KB04: Chỉ định dịch vụ cận lâm sàng (Bác sĩ)
	@Test
	@Order(42)
	void testUcKb04OrderClinicalServices() {
		// Tạo trước một phiên khám nháp
		com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest diagReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest();
		diagReq.setPatientId(1L);
		diagReq.setDoctorId(2L);
		diagReq.setRoomId(1L);
		diagReq.setChiefComplaint("Chỉ định chụp X-quang và xét nghiệm máu");
		var record = medicalExaminationService.saveDiagnosis(diagReq);

		// Chỉ định dịch vụ
		com.clinic.clinic_management.dto.MedicalExaminationDtos.OrderLabServicesRequest orderReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.OrderLabServicesRequest();
		orderReq.setMedicalRecordId(record.getId());
		orderReq.setDoctorId(2L);
		orderReq.setPatientId(1L);
		orderReq.setDiagnosisNote("Kiểm tra khớp và công thức máu");
		orderReq.setServiceIds(java.util.List.of(1L, 5L)); // Tổng phân tích máu + Chụp X-quang

		var labOrder = medicalExaminationService.orderClinicalServices(orderReq);
		assertNotNull(labOrder);
		assertNotNull(labOrder.getId());
		assertTrue(labOrder.getOrderCode().startsWith("CLS"));
		assertEquals(2, labOrder.getItems().size());
		assertEquals("PENDING", labOrder.getStatus());

		// Record status được tự động chuyển sang WAITING_PARACLINICAL
		var updatedRecord = medicalExaminationService.getMedicalRecordById(record.getId());
		assertEquals("WAITING_PARACLINICAL", updatedRecord.getStatus());
	}

	// UC-KB05: Xem và cập nhật kết quả cận lâm sàng (Bác sĩ, Kỹ thuật viên)
	@Test
	@Order(43)
	void testUcKb05ViewAndCompleteClinicalResults() {
		// Tạo chỉ định
		com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest diagReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest();
		diagReq.setPatientId(1L);
		diagReq.setDoctorId(2L);
		diagReq.setRoomId(1L);
		diagReq.setChiefComplaint("Khám tổng quát và đo đường huyết");
		var record = medicalExaminationService.saveDiagnosis(diagReq);

		com.clinic.clinic_management.dto.MedicalExaminationDtos.OrderLabServicesRequest orderReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.OrderLabServicesRequest();
		orderReq.setMedicalRecordId(record.getId());
		orderReq.setDoctorId(2L);
		orderReq.setPatientId(1L);
		orderReq.setServiceIds(java.util.List.of(2L)); // Đo đường huyết

		var labOrder = medicalExaminationService.orderClinicalServices(orderReq);
		Long resultId = labOrder.getItems().get(0).getId();

		// Kỹ thuật viên nhập kết quả
		com.clinic.clinic_management.dto.MedicalExaminationDtos.UpdateLabResultRequest updateReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.UpdateLabResultRequest();
		updateReq.setResultId(resultId);
		updateReq.setTechnicianId(5L); // KTV Lê Văn Đức
		updateReq.setTestValue("5.4");
		updateReq.setReferenceRange("3.9 - 6.4");
		updateReq.setUnit("mmol/L");
		updateReq.setConclusion("Đường huyết lúc đói bình thường trong giới hạn tham chiếu");

		var completedResult = medicalExaminationService.updateLabResult(updateReq);
		assertEquals("COMPLETED", completedResult.getStatus());
		assertEquals("5.4", completedResult.getTestValue());

		// Bác sĩ xem kết quả
		var orders = medicalExaminationService.getLabOrdersByRecord(record.getId());
		assertEquals(1, orders.size());
		assertEquals("COMPLETED", orders.get(0).getStatus());
		assertEquals("COMPLETED", orders.get(0).getItems().get(0).getStatus());
	}

	// UC-KB06: Hẹn tái khám (Bác sĩ)
	@Test
	@Order(44)
	void testUcKb06ScheduleFollowUp() {
		com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest diagReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest();
		diagReq.setPatientId(1L);
		diagReq.setDoctorId(2L);
		diagReq.setRoomId(1L);
		diagReq.setChiefComplaint("Theo dõi định kỳ huyết áp");
		var record = medicalExaminationService.saveDiagnosis(diagReq);

		java.time.LocalDate followUp = java.time.LocalDate.now().plusWeeks(2);
		com.clinic.clinic_management.dto.MedicalExaminationDtos.ScheduleFollowUpRequest followReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.ScheduleFollowUpRequest();
		followReq.setMedicalRecordId(record.getId());
		followReq.setFollowUpDate(followUp);
		followReq.setDoctorAdvice("Đo huyết áp hàng ngày tại nhà vào mỗi buổi sáng, tái khám sau 2 tuần hoặc khi có dấu hiệu bất thường");

		var updated = medicalExaminationService.scheduleFollowUp(followReq);
		assertEquals(followUp, updated.getFollowUpDate());
		assertTrue(updated.getDoctorAdvice().contains("Đo huyết áp hàng ngày"));
	}

	// UC-KB07: Kết thúc phiên khám (Bác sĩ)
	@Test
	@Order(45)
	void testUcKb07CompleteEncounter() {
		// Tạo bệnh nhân vãng lai chờ khám tại phòng 1
		com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest walkInReq =
				new com.clinic.clinic_management.dto.QueueDtos.WalkInReceptionRequest();
		walkInReq.setFullName("BN Phiên Khám Hoàn Tất");
		walkInReq.setPhone("09" + (int)(Math.random() * 90000000 + 10000000));
		walkInReq.setRoomId(1L);
		var ticket = queueService.receptionWalkIn(walkInReq, 3L);

		// Mở phiên khám
		com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest diagReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.SaveDiagnosisRequest();
		diagReq.setTicketId(ticket.getId());
		diagReq.setPatientId(ticket.getPatientId());
		diagReq.setDoctorId(2L);
		diagReq.setRoomId(1L);
		diagReq.setChiefComplaint("Viêm họng cấp, sốt nhẹ 37.8 độ");
		var record = medicalExaminationService.saveDiagnosis(diagReq);

		// Thử kết thúc phiên khám mà chưa có chẩn đoán xác định -> ném Exception
		com.clinic.clinic_management.dto.MedicalExaminationDtos.CompleteEncounterRequest compReq =
				new com.clinic.clinic_management.dto.MedicalExaminationDtos.CompleteEncounterRequest();
		compReq.setMedicalRecordId(record.getId());
		assertThrows(IllegalArgumentException.class, () -> {
			medicalExaminationService.completeEncounter(compReq);
		}, "Bắt buộc phải có chẩn đoán xác định khi kết thúc khám");

		// Bổ sung chẩn đoán xác định và kết thúc
		compReq.setFinalDiagnosis("Viêm họng cấp tính do thời tiết (J02.9)");
		compReq.setIcd10Code("J02.9");
		compReq.setDoctorAdvice("Súc họng nước muối sinh lý, uống nhiều nước ấm, giữ ấm cổ");
		compReq.setTicketId(ticket.getId());

		var completed = medicalExaminationService.completeEncounter(compReq);
		assertEquals("COMPLETED", completed.getStatus());
		assertEquals("Viêm họng cấp tính do thời tiết (J02.9)", completed.getFinalDiagnosis());

		// Phiếu hàng đợi cũng phải tự động chuyển sang COMPLETED
		var updatedTicket = queueTicketRepository.findById(ticket.getId()).orElseThrow();
		assertEquals("COMPLETED", updatedTicket.getStatus());
		assertNotNull(updatedTicket.getCompletedAt());
	}

	// UC-KB08: In phiếu khám / tóm tắt bệnh án (Bác sĩ, Lễ tân)
	@Test
	@Order(46)
	void testUcKb08PrintMedicalSummary() {
		// Lấy tóm tắt hồ sơ mẫu ID 1 từ seed data
		var printDto = medicalExaminationService.getEncounterSummaryPrint(1L);
		assertNotNull(printDto);
		assertEquals(1L, printDto.getRecordId());
		assertNotNull(printDto.getRecordCode());
		assertNotNull(printDto.getPatientName());
		assertNotNull(printDto.getDoctorName());
		assertNotNull(printDto.getRoomName());
		assertNotNull(printDto.getChiefComplaint());
		assertNotNull(printDto.getFinalDiagnosis());
		assertNotNull(printDto.getIcd10Code());
		assertNotNull(printDto.getClinicName());
		assertNotNull(printDto.getClinicAddress());
	}

	// =========================================================================
	// PHÂN HỆ 3.8: KÊ ĐƠN VÀ KHO THUỐC (10 USE CASES)
	// =========================================================================

	// UC-DT01: Kê đơn thuốc (Bác sĩ)
	@Test
	@Order(47)
	void testUcDt01CreatePrescription() {
		com.clinic.clinic_management.dto.PharmacyDtos.CreatePrescriptionRequest req =
				new com.clinic.clinic_management.dto.PharmacyDtos.CreatePrescriptionRequest();
		req.setMedicalRecordId(1L);
		req.setDoctorId(2L);
		req.setPatientId(1L);
		req.setDiagnosis("Đau đầu do căng thẳng (G44.2)");
		req.setUsageNote("Uống thuốc đúng giờ sau ăn no");

		com.clinic.clinic_management.dto.PharmacyDtos.PrescriptionItemRequest item1 =
				new com.clinic.clinic_management.dto.PharmacyDtos.PrescriptionItemRequest();
		item1.setMedicineId(1L); // Panadol Extra
		item1.setQuantity(10);
		item1.setMorningDose("1");
		item1.setNightDose("1");
		item1.setInstructions("Uống sau ăn");

		com.clinic.clinic_management.dto.PharmacyDtos.PrescriptionItemRequest item2 =
				new com.clinic.clinic_management.dto.PharmacyDtos.PrescriptionItemRequest();
		item2.setMedicineId(4L); // Nexium 40mg
		item2.setQuantity(5);
		item2.setMorningDose("1");
		item2.setInstructions("Uống trước ăn sáng 30 phút");

		req.setItems(java.util.List.of(item1, item2));

		var resp = pharmacyService.createPrescription(req);
		assertNotNull(resp);
		assertNotNull(resp.getId());
		assertTrue(resp.getPrescriptionCode().startsWith("DT"));
		assertEquals(2, resp.getItems().size());
		assertEquals("PENDING_PAYMENT", resp.getStatus());
		assertTrue(resp.getTotalAmount().compareTo(java.math.BigDecimal.ZERO) > 0);
	}

	// UC-DT02: Cảnh báo dị ứng khi kê đơn (Hệ thống)
	@Test
	@Order(48)
	void testUcDt02CheckAllergies() {
		// Tạo bệnh nhân có tiền sử dị ứng Penicillin và Paracetamol
		com.clinic.clinic_management.entity.Patient allergicPatient = new com.clinic.clinic_management.entity.Patient();
		allergicPatient.setPatientCode("BN_ALLERGY_" + System.currentTimeMillis());
		allergicPatient.setFullName("Trần Văn Dị Ứng");
		allergicPatient.setGender("MALE");
		allergicPatient.setDateOfBirth(java.time.LocalDate.of(1995, 5, 20));
		allergicPatient.setPhone("098" + (int)(Math.random() * 9000000 + 1000000));
		allergicPatient.setDrugAllergies("Dị ứng Penicillin, mẩn ngứa khi dùng Paracetamol");
		allergicPatient = patientRepository.save(allergicPatient);

		com.clinic.clinic_management.dto.PharmacyDtos.AllergyCheckRequest req =
				new com.clinic.clinic_management.dto.PharmacyDtos.AllergyCheckRequest();
		req.setPatientId(allergicPatient.getId());
		req.setMedicineIds(java.util.List.of(1L, 2L)); // 1L: Panadol (Paracetamol), 2L: Augmentin (Amoxicillin/Penicillin)

		var alertResp = pharmacyService.checkAllergies(req);
		assertNotNull(alertResp);
		assertTrue(alertResp.isHasRisk(), "Hệ thống phải phát hiện nguy cơ dị ứng nghiêm trọng");
		assertFalse(alertResp.getWarnings().isEmpty());
		assertEquals("HIGH", alertResp.getWarnings().get(0).getSeverity());
		assertTrue(alertResp.getWarnings().get(0).getMessage().contains("nguy cơ dị ứng"));
	}

	// UC-DT03: In đơn thuốc (Bác sĩ, Dược sĩ)
	@Test
	@Order(49)
	void testUcDt03PrintPrescription() {
		// Sử dụng đơn thuốc mẫu ID 1 trong seed data
		var printData = pharmacyService.getPrescriptionPrintData(1L);
		assertNotNull(printData);
		assertEquals(1L, printData.getPrescriptionId());
		assertNotNull(printData.getPrescriptionCode());
		assertNotNull(printData.getPatientName());
		assertNotNull(printData.getDoctorName());
		assertNotNull(printData.getDiagnosis());
		assertNotNull(printData.getClinicName());
		assertNotNull(printData.getClinicAddress());
		assertFalse(printData.getItems().isEmpty());
	}

	// UC-DT04: Cấp phát thuốc theo đơn (Dược sĩ)
	@Test
	@Order(50)
	void testUcDt04DispensePrescription() {
		// Tạo đơn thuốc mới để cấp phát
		com.clinic.clinic_management.dto.PharmacyDtos.CreatePrescriptionRequest req =
				new com.clinic.clinic_management.dto.PharmacyDtos.CreatePrescriptionRequest();
		req.setMedicalRecordId(1L);
		req.setPatientId(1L);
		req.setDoctorId(2L);
		req.setDiagnosis("Tăng huyết áp vô căn (I10)");

		com.clinic.clinic_management.dto.PharmacyDtos.PrescriptionItemRequest item =
				new com.clinic.clinic_management.dto.PharmacyDtos.PrescriptionItemRequest();
		item.setMedicineId(3L); // Amlor 5mg
		item.setQuantity(2);
		item.setMorningDose("1");
		req.setItems(java.util.List.of(item));

		var pres = pharmacyService.createPrescription(req);

		// Dược sĩ cấp phát thuốc
		com.clinic.clinic_management.dto.PharmacyDtos.DispensePrescriptionRequest dispReq =
				new com.clinic.clinic_management.dto.PharmacyDtos.DispensePrescriptionRequest();
		dispReq.setPrescriptionId(pres.getId());
		dispReq.setPharmacistId(6L); // DS001 Phạm Thị Nga
		dispReq.setNote("Đã dặn dò bệnh nhân uống vào mỗi buổi sáng");

		var dispResp = pharmacyService.dispensePrescription(dispReq);
		assertNotNull(dispResp);
		assertNotNull(dispResp.getId());
		assertTrue(dispResp.getDispensationCode().startsWith("CP"));
		assertEquals(pres.getId(), dispResp.getPrescriptionId());

		// Đơn thuốc chuyển sang DISPENSED
		var updatedPres = pharmacyService.getPrescriptionById(pres.getId());
		assertEquals("DISPENSED", updatedPres.getStatus());
	}

	// UC-DT05: Quản lý danh mục thuốc (Dược sĩ)
	@Test
	@Order(51)
	void testUcDt05ManageMedicinesAndCategories() {
		// Thêm mới thuốc
		com.clinic.clinic_management.dto.PharmacyDtos.SaveMedicineRequest medReq =
				new com.clinic.clinic_management.dto.PharmacyDtos.SaveMedicineRequest();
		medReq.setCategoryId(1L);
		medReq.setCode("MED_TEST_" + System.currentTimeMillis() % 10000);
		medReq.setBrandName("Efferalgan 500mg");
		medReq.setActiveIngredient("Paracetamol 500mg");
		medReq.setDosageForm("Viên sủi");
		medReq.setUnit("Viên");
		medReq.setSellingPrice(new java.math.BigDecimal("3500.00"));
		medReq.setUsageInstructions("Hòa tan 1 viên vào 200ml nước đun sôi để nguội");

		var savedMed = pharmacyService.saveMedicine(medReq);
		assertNotNull(savedMed);
		assertNotNull(savedMed.getId());
		assertEquals("Efferalgan 500mg", savedMed.getBrandName());

		// Tra cứu theo từ khóa
		var searchResult = pharmacyService.getAllMedicines("Efferalgan", null);
		assertFalse(searchResult.isEmpty());
	}

	// UC-DT06: Nhập kho thuốc (Dược sĩ)
	@Test
	@Order(52)
	void testUcDt06ImportStock() {
		com.clinic.clinic_management.dto.PharmacyDtos.ImportStockRequest req =
				new com.clinic.clinic_management.dto.PharmacyDtos.ImportStockRequest();
		req.setMedicineId(1L); // Panadol Extra
		req.setSupplierId(1L); // DHG Pharma
		req.setBatchNumber("BATCH_TEST_" + (int)(Math.random() * 9000 + 1000));
		req.setManufactureDate(java.time.LocalDate.now().minusMonths(2));
		req.setExpiryDate(java.time.LocalDate.now().plusYears(2));
		req.setImportPrice(new java.math.BigDecimal("2000.00"));
		req.setQuantityImported(300);
		req.setPharmacistId(6L);
		req.setNote("Nhập bổ sung kho chính quý 4");

		var batchDto = pharmacyService.importStock(req);
		assertNotNull(batchDto);
		assertNotNull(batchDto.getId());
		assertEquals(300, batchDto.getQuantityImported());
		assertEquals(300, batchDto.getQuantityAvailable());
		assertFalse(batchDto.isExpired());
	}

	// UC-DT07: Kiểm kê tồn kho thuốc (Dược sĩ)
	@Test
	@Order(53)
	void testUcDt07StockAudit() {
		// Lấy danh sách lô thuốc của Panadol Extra (ID 1)
		var batches = pharmacyService.getAllBatches(1L);
		assertFalse(batches.isEmpty());
		var targetBatch = batches.get(0);

		int newCount = targetBatch.getQuantityAvailable() + 10;
		com.clinic.clinic_management.dto.PharmacyDtos.StockAuditRequest auditReq =
				new com.clinic.clinic_management.dto.PharmacyDtos.StockAuditRequest();
		auditReq.setBatchId(targetBatch.getId());
		auditReq.setPharmacistId(6L);
		auditReq.setActualQuantity(newCount);
		auditReq.setReason("Kiểm đếm định kỳ cuối tuần, phát hiện dư 10 viên");

		var audited = pharmacyService.auditStock(auditReq);
		assertNotNull(audited);
		assertEquals(newCount, audited.getQuantityAvailable());
	}

	// UC-DT08: Cảnh báo thuốc sắp hết / sắp hết hạn (Hệ thống, Dược sĩ)
	@Test
	@Order(54)
	void testUcDt08StockAlerts() {
		// Lấy cảnh báo với ngưỡng tồn thấp 100 và ngưỡng hết hạn 180 ngày
		var alerts = pharmacyService.getStockAlerts(100, 180);
		assertNotNull(alerts);
		assertTrue(alerts.getLowStockCount() >= 0);
		assertTrue(alerts.getNearExpiryCount() >= 0);
		assertNotNull(alerts.getAlerts());
	}

	// UC-DT09: Quản lý nhà cung cấp (Dược sĩ)
	@Test
	@Order(55)
	void testUcDt09ManageSuppliers() {
		com.clinic.clinic_management.dto.PharmacyDtos.SaveSupplierRequest req =
				new com.clinic.clinic_management.dto.PharmacyDtos.SaveSupplierRequest();
		req.setName("Công ty TNHH Dược phẩm Sanofi-Aventis Việt Nam");
		req.setTaxCode("0302821234");
		req.setPhone("02838298526");
		req.setEmail("contact@sanofi.com.vn");
		req.setAddress("Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh");

		var saved = pharmacyService.saveSupplier(req);
		assertNotNull(saved);
		assertNotNull(saved.getId());
		assertEquals("Công ty TNHH Dược phẩm Sanofi-Aventis Việt Nam", saved.getName());

		var list = pharmacyService.getAllSuppliers();
		assertFalse(list.isEmpty());
	}

	// UC-DT10: Xem lịch sử nhập - xuất thuốc (Dược sĩ, Quản lý)
	@Test
	@Order(56)
	void testUcDt10StockTransactions() {
		var txList = pharmacyService.getStockTransactions(null, null, null);
		assertNotNull(txList);
		assertFalse(txList.isEmpty(), "Kho thuốc phải có nhật ký giao dịch xuất/nhập kho");
		var firstTx = txList.get(0);
		assertNotNull(firstTx.getTransactionType());
		assertNotNull(firstTx.getQuantity());
		assertNotNull(firstTx.getTransactionDate());
	}

	// =========================================================================
	// PHÂN HỆ 3.9: THANH TOÁN VÀ VIỆN PHÍ (7 USE CASES: UC-TT01 ĐẾN UC-TT07)
	// =========================================================================

	// UC-TT01: Lập hóa đơn từ phiên khám (Thu ngân)
	@Test
	@Order(57)
	void testUcTt01CreateInvoiceFromMedicalRecord() {
		com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest req =
				new com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest();
		req.setMedicalRecordId(1L);
		req.setCashierId(7L); // Đỗ Thúy Hằng - TN001
		req.setNote("Lập hóa đơn thanh toán phiên khám chuẩn");

		var invoice = billingService.createInvoiceFromMedicalRecord(req);
		assertNotNull(invoice);
		assertNotNull(invoice.getInvoiceCode());
		assertTrue(invoice.getInvoiceCode().startsWith("HD"));
		assertEquals("UNPAID", invoice.getStatus());
		assertNotNull(invoice.getItems());
		assertFalse(invoice.getItems().isEmpty(), "Hóa đơn phải có danh sách các khoản mục phí");
		assertTrue(invoice.getFinalAmount().compareTo(java.math.BigDecimal.ZERO) >= 0);
	}

	// UC-TT02: Áp dụng bảo hiểm y tế / giảm giá (Thu ngân)
	@Test
	@Order(58)
	void testUcTt02ApplyInsuranceAndDiscount() {
		// Tạo hóa đơn từ phiên khám 1
		com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest cReq =
				new com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest();
		cReq.setMedicalRecordId(1L);
		cReq.setCashierId(7L);
		var invoice = billingService.createInvoiceFromMedicalRecord(cReq);

		// Áp dụng BHYT 80% và giảm giá 50,000 VND
		com.clinic.clinic_management.dto.BillingDtos.ApplyInsuranceDiscountRequest req =
				new com.clinic.clinic_management.dto.BillingDtos.ApplyInsuranceDiscountRequest();
		req.setInsuranceRate(java.math.BigDecimal.valueOf(80)); // 80% BHYT
		req.setDiscountAmount(java.math.BigDecimal.valueOf(50000));
		req.setDiscountReason("Voucher tri ân khách hàng thân thiết");

		var updated = billingService.applyInsuranceAndDiscount(invoice.getId(), req);
		assertNotNull(updated);
		assertTrue(updated.getInsurancePaidAmount().compareTo(java.math.BigDecimal.ZERO) > 0);
		assertEquals(0, updated.getDiscountAmount().compareTo(java.math.BigDecimal.valueOf(50000)));
		assertTrue(updated.getFinalAmount().compareTo(invoice.getTotalServiceAmount().add(invoice.getTotalMedicineAmount())) < 0);
	}

	// UC-TT03: Thu tiền (tiền mặt, chuyển khoản, thẻ, ví) (Thu ngân)
	@Test
	@Order(59)
	void testUcTt03ProcessPayment() {
		// 1. Tạo hóa đơn
		com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest cReq =
				new com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest();
		cReq.setMedicalRecordId(1L);
		cReq.setCashierId(7L);
		var invoice = billingService.createInvoiceFromMedicalRecord(cReq);

		// 2. Thu tiền bằng Chuyển khoản QR
		com.clinic.clinic_management.dto.BillingDtos.ProcessPaymentRequest pReq =
				new com.clinic.clinic_management.dto.BillingDtos.ProcessPaymentRequest();
		pReq.setInvoiceId(invoice.getId());
		pReq.setCashierId(7L);
		pReq.setAmount(invoice.getFinalAmount());
		pReq.setPaymentMethod("BANK_TRANSFER");
		pReq.setTransactionReference("VNPAY_QR_99881122");
		pReq.setNote("Khách quét mã QR VietQR ngân hàng");

		var paymentResult = billingService.processPayment(pReq);
		assertNotNull(paymentResult);
		assertTrue(paymentResult.isSuccess());
		assertNotNull(paymentResult.getPaymentCode());
		assertTrue(paymentResult.getPaymentCode().startsWith("TT"));

		// 3. Kiểm tra hóa đơn đã chuyển trạng thái sang PAID
		var reloaded = billingService.getInvoiceById(invoice.getId());
		assertEquals("PAID", reloaded.getStatus());
		assertFalse(reloaded.getPayments().isEmpty());
	}

	// UC-TT04: In / gửi hóa đơn (Thu ngân)
	@Test
	@Order(60)
	void testUcTt04InvoicePrintAndEmail() {
		// Tạo và thanh toán một hóa đơn
		com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest cReq =
				new com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest();
		cReq.setMedicalRecordId(1L);
		cReq.setCashierId(7L);
		var invoice = billingService.createInvoiceFromMedicalRecord(cReq);

		var printData = billingService.getInvoicePrintData(invoice.getId());
		assertNotNull(printData);
		assertNotNull(printData.getInvoiceCode());
		assertNotNull(printData.getPatientName());
		assertNotNull(printData.getAmountInWords(), "Hóa đơn in phải có số tiền viết bằng chữ tiếng Việt");
		assertTrue(printData.getAmountInWords().endsWith("đồng chẵn"));

		// Test gửi email hóa đơn điện tử
		boolean emailSent = billingService.sendInvoiceEmail(invoice.getId(), "benhnhan@gmail.com");
		assertTrue(emailSent);
	}

	// UC-TT05: Hoàn tiền / Hủy giao dịch (Thu ngân, Quản lý)
	@Test
	@Order(61)
	void testUcTt05RefundOrCancelInvoice() {
		// 1. Test hủy hóa đơn chưa thanh toán
		com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest cReq =
				new com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest();
		cReq.setMedicalRecordId(1L);
		cReq.setCashierId(7L);
		var invoice = billingService.createInvoiceFromMedicalRecord(cReq);

		com.clinic.clinic_management.dto.BillingDtos.RefundInvoiceRequest cancelReq =
				new com.clinic.clinic_management.dto.BillingDtos.RefundInvoiceRequest();
		cancelReq.setInvoiceId(invoice.getId());
		cancelReq.setActorId(7L);
		cancelReq.setReason("Bệnh nhân đổi lịch khám sang tuần sau");

		var cancelled = billingService.refundOrCancelInvoice(cancelReq);
		assertEquals("CANCELLED", cancelled.getStatus());

		// 2. Test hoàn tiền cho hóa đơn đã thanh toán
		com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest cReq2 =
				new com.clinic.clinic_management.dto.BillingDtos.CreateInvoiceRequest();
		cReq2.setMedicalRecordId(1L);
		cReq2.setCashierId(7L);
		var invoice2 = billingService.createInvoiceFromMedicalRecord(cReq2);

		com.clinic.clinic_management.dto.BillingDtos.ProcessPaymentRequest pReq =
				new com.clinic.clinic_management.dto.BillingDtos.ProcessPaymentRequest();
		pReq.setInvoiceId(invoice2.getId());
		pReq.setCashierId(7L);
		pReq.setAmount(invoice2.getFinalAmount());
		pReq.setPaymentMethod("CASH");
		billingService.processPayment(pReq);

		com.clinic.clinic_management.dto.BillingDtos.RefundInvoiceRequest refundReq =
				new com.clinic.clinic_management.dto.BillingDtos.RefundInvoiceRequest();
		refundReq.setInvoiceId(invoice2.getId());
		refundReq.setActorId(7L);
		refundReq.setReason("Bệnh nhân hủy dịch vụ siêu âm do có việc gấp");

		var refunded = billingService.refundOrCancelInvoice(refundReq);
		assertEquals("REFUNDED", refunded.getStatus());
	}

	// UC-TT06: Xem lịch sử giao dịch & Thống kê doanh thu (Thu ngân, Quản lý, Bệnh nhân)
	@Test
	@Order(62)
	void testUcTt06GetInvoicesAndStats() {
		var list = billingService.getInvoices(null, null, null, null);
		assertNotNull(list);
		assertFalse(list.isEmpty());

		var stats = billingService.getBillingOverviewStats(null, null);
		assertNotNull(stats);
		assertNotNull(stats.getTotalRevenue());
		assertTrue(stats.getPaidInvoiceCount() >= 0);
	}

	// UC-TT07: Quản lý bảng giá dịch vụ (Quản lý)
	@Test
	@Order(63)
	void testUcTt07ManageServicePrices() {
		// Thêm dịch vụ mới
		com.clinic.clinic_management.dto.BillingDtos.SaveServicePriceRequest req =
				new com.clinic.clinic_management.dto.BillingDtos.SaveServicePriceRequest();
		req.setName("Nội soi dạ dày không đau (gây mê)");
		req.setCode("SRV_ENDOSCOPY_" + (System.currentTimeMillis() % 10000));
		req.setCategoryId(2L);
		req.setPrice(java.math.BigDecimal.valueOf(1800000));
		req.setInsuranceCovered(true);
		req.setEstimatedDurationMinutes(30);
		req.setDescription("Nội soi thực quản - dạ dày - tá tràng bằng ống mềm có an thần");

		var saved = billingService.saveServicePrice(req);
		assertNotNull(saved);
		assertNotNull(saved.getId());
		assertEquals("Nội soi dạ dày không đau (gây mê)", saved.getName());
		assertEquals(0, saved.getPrice().compareTo(java.math.BigDecimal.valueOf(1800000)));

		// Tra cứu danh sách bảng giá
		var services = billingService.getAllServices(null, null);
		assertFalse(services.isEmpty());
	}

	// =========================================================================
	// PHÂN HỆ 3.10: BÁO CÁO (8 USE CASES)
	// =========================================================================

	@Test
	@Order(65)
	void testUcBc01RevenueReport() {
		// Báo cáo doanh thu theo ngày/tháng/năm
		var repMonthly = reportService.getRevenueReport("MONTHLY", null, null);
		assertNotNull(repMonthly);
		assertEquals("MONTHLY", repMonthly.getPeriod());
		assertNotNull(repMonthly.getTotalRevenue());
		assertNotNull(repMonthly.getNetRevenue());
		assertNotNull(repMonthly.getPaymentMethodBreakdown());
		assertTrue(repMonthly.getPaymentMethodBreakdown().containsKey("Tiền mặt"));
		assertFalse(repMonthly.getTimelineData().isEmpty());

		var repCustom = reportService.getRevenueReport("CUSTOM", LocalDate.now().minusDays(7), LocalDate.now());
		assertNotNull(repCustom);
		assertEquals(8, repCustom.getTimelineData().size());
	}

	@Test
	@Order(66)
	void testUcBc02DoctorServiceRevenue() {
		// Báo cáo doanh thu theo dịch vụ và bác sĩ
		var docServRep = reportService.getDoctorServiceRevenue(LocalDate.now().minusDays(30), LocalDate.now());
		assertNotNull(docServRep);
		assertNotNull(docServRep.getTopServices());
		assertNotNull(docServRep.getDoctorRevenues());
		assertNotNull(docServRep.getTotalServicesAmount());
	}

	@Test
	@Order(67)
	void testUcBc03VisitReport() {
		// Báo cáo lượt khám
		var visitRep = reportService.getVisitReport(LocalDate.now().minusDays(30), LocalDate.now());
		assertNotNull(visitRep);
		assertTrue(visitRep.getTotalVisits() >= 0);
		assertNotNull(visitRep.getDepartmentVisits());
		assertNotNull(visitRep.getDemographics());
		assertTrue(visitRep.getDemographics().getMaleCount() >= 0);
		assertTrue(visitRep.getDemographics().getFemaleCount() >= 0);
	}

	@Test
	@Order(68)
	void testUcBc04CommonDiseasesReport() {
		// Thống kê bệnh thường gặp
		var diseaseRep = reportService.getCommonDiseases(LocalDate.now().minusDays(60), LocalDate.now(), 10);
		assertNotNull(diseaseRep);
		assertNotNull(diseaseRep.getTopDiseases());
		if (!diseaseRep.getTopDiseases().isEmpty()) {
			var first = diseaseRep.getTopDiseases().get(0);
			assertNotNull(first.getDiseaseName());
			assertTrue(first.getCaseCount() > 0);
		}
	}

	@Test
	@Order(69)
	void testUcBc05MedicineStockReport() {
		// Báo cáo thuốc dùng và tồn kho
		var medRep = reportService.getMedicineStockReport();
		assertNotNull(medRep);
		assertNotNull(medRep.getTopPrescribedMedicines());
		assertNotNull(medRep.getStockOverview());
		assertTrue(medRep.getStockOverview().getTotalMedicinesCount() >= 0);
		assertNotNull(medRep.getStockOverview().getTotalInventoryValue());
		assertNotNull(medRep.getAlertItems());
	}

	@Test
	@Order(70)
	void testUcBc06AppointmentReport() {
		// Báo cáo lịch hẹn (tỷ lệ hủy, no-show)
		var appRep = reportService.getAppointmentReport(LocalDate.now().minusDays(30), LocalDate.now());
		assertNotNull(appRep);
		assertTrue(appRep.getTotalAppointments() >= 0);
		assertNotNull(appRep.getCancellationRate());
		assertNotNull(appRep.getNoShowRate());
		assertNotNull(appRep.getCancellationReasons());
		assertNotNull(appRep.getChannelStats());
	}

	@Test
	@Order(71)
	void testUcBc07RealtimeDashboard() {
		// Dashboard thời gian thực
		var dash = reportService.getRealtimeDashboard();
		assertNotNull(dash);
		assertNotNull(dash.getLastUpdated());
		assertTrue(dash.getTodayPatientsRegistered() >= 0);
		assertNotNull(dash.getTodayRevenue());
		assertEquals(12, dash.getHourlyVisits().size()); // 7:00 đến 18:00
		assertFalse(dash.getRecentActivities().isEmpty());
	}

	@Test
	@Order(72)
	void testUcBc08ExportReportCsv() {
		// Xuất báo cáo Excel / CSV
		byte[] revCsv = reportService.exportReportToCsv("REVENUE", LocalDate.now().minusDays(7), LocalDate.now());
		assertNotNull(revCsv);
		assertTrue(revCsv.length > 0);
		String text = new String(revCsv, java.nio.charset.StandardCharsets.UTF_8);
		assertTrue(text.contains("CAREPLUS"));
		assertTrue(text.contains("BÁO CÁO TÀI CHÍNH"));

		byte[] diseaseCsv = reportService.exportReportToCsv("DISEASES", LocalDate.now().minusDays(30), LocalDate.now());
		assertNotNull(diseaseCsv);
		assertTrue(diseaseCsv.length > 0);
	}
}

