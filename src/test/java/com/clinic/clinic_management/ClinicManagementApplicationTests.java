package com.clinic.clinic_management;

import com.clinic.clinic_management.controller.WebController;
import com.clinic.clinic_management.dto.AccountDtos.*;
import com.clinic.clinic_management.dto.AuthDtos.*;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.repository.RoleRepository;
import com.clinic.clinic_management.service.*;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

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
		assertFalse(records.isEmpty(), "Benh nhan 1 phai co lich su kham benh");
		var first = records.get(0);
		assertEquals("BA20261031001", first.getRecordCode());
		assertNotNull(first.getDoctorName(), "Ten bac si phai duoc hien thi");
		assertNotNull(first.getRoomName(), "Ten phong kham phai duoc hien thi");

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
}
