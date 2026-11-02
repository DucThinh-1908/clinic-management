package com.clinic.clinic_management.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    @GetMapping({
        "/gioi-thieu",
        "/gioi-thieu.html",
        "/about",
        "/about.html",
        "/lien-he",
        "/lien-he.html",
        "/contact",
        "/contact.html",
        "/dich-vu",
        "/dich-vu.html",
        "/services",
        "/services.html",
        "/trang-chu",
        "/index",
        "/dang-nhap",
        "/login",
        "/dang-ky",
        "/register",
        "/quen-mat-khau",
        "/forgot-password",
        "/admin/tai-khoan",
        "/admin/phan-quyen",
        "/admin/nhat-ky-ho-so",
        "/quan-ly-benh-nhan",
        "/ho-so-benh-nhan",
        "/patient-portal",
        "/quan-ly-nhan-su",
        "/quan-ly-chuyen-khoa",
        "/lich-lam-viec",
        "/dang-ky-ca",
        "/cham-cong",
        "/lich-hen",
        "/dat-lich",
        "/quan-ly-lich-hen",
        "/tiep-don",
        "/hang-cho",
        "/tiep-don-xep-hang",
        "/man-hinh-goi-so",
        "/kham-benh",
        "/phong-kham-bac-si",
        "/phong-kham",
        "/ghi-nhan-sinh-hieu"
    })
    public String forwardToSpa() {
        return "forward:/index.html";
    }

    public String index() {
        return "forward:/index.html";
    }

    public String about() {
        return forwardToSpa();
    }

    public String contact() {
        return forwardToSpa();
    }

    public String services() {
        return forwardToSpa();
    }
}
