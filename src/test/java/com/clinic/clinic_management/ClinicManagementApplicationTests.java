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

	// UC-TK02: Dang xuat
	@Test
	@Order(5)
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

		// Assign multiple roles to user 9 (patient_nam)
		UserSummary userSummary = rolePermissionService.assignRolesToUser(9L, Set.of("patient", "receptionist"), 1L, "127.0.0.1");
		assertTrue(userSummary.getRoles().contains("receptionist"), "Nguoi dung phai duoc gan vai tro moi");

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

		// Retrieve all access logs
		List<MedicalRecordAccessLogResponse> logs = recordAccessLogService.getMedicalRecordAccessLogs();
		assertFalse(logs.isEmpty(), "Danh sach nhat ky truy cap ho so phai co du lieu");
		assertTrue(logs.stream().anyMatch(l -> "HSBA-2026-TEST".equals(l.getRecordCode())),
				"Nhat ky vua tao phai xuat hien trong danh sach");
	}
}
