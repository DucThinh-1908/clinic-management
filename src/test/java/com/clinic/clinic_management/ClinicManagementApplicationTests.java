package com.clinic.clinic_management;

import com.clinic.clinic_management.controller.WebController;
import com.clinic.clinic_management.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ClinicManagementApplicationTests {

	@Autowired
	private RoleRepository roleRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void testDatabaseConnectionAndRoles() {
		long count = roleRepository.count();
		assertTrue(count >= 9, "Cơ sở dữ liệu phải có tối thiểu 9 vai trò đã nạp từ seed data");
		assertTrue(roleRepository.findByCode("doctor").isPresent(), "Vai trò 'doctor' phải tồn tại");
		assertTrue(roleRepository.findByCode("patient").isPresent(), "Vai trò 'patient' phải tồn tại");
		assertTrue(roleRepository.findByCode("nurse").isPresent(), "Vai trò 'nurse' phải tồn tại");
	}

	@Test
	void testWebControllerRoutes() {
		WebController controller = new WebController();
		assertEquals("forward:/index.html", controller.forwardToSpa());
		assertEquals("forward:/index.html", controller.index());
		assertEquals("forward:/index.html", controller.about());
		assertEquals("forward:/index.html", controller.contact());
		assertEquals("forward:/index.html", controller.services());
	}
}
