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
        "/index"
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
