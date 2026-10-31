package com.clinic.clinic_management;

import com.clinic.clinic_management.controller.WebController;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class ClinicManagementApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void testWebControllerRoutes() {
		WebController controller = new WebController();
		assertEquals("index", controller.index());
		assertEquals("gioi-thieu", controller.about());
		assertEquals("lien-he", controller.contact());
		assertEquals("dich-vu", controller.services());
	}
}
