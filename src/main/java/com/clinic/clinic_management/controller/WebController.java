package com.clinic.clinic_management.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    @GetMapping({"/", "/index", "/index.html", "/trang-chu"})
    public String index() {
        return "index";
    }

    @GetMapping({"/gioi-thieu", "/gioi-thieu.html", "/about", "/about.html"})
    public String about() {
        return "gioi-thieu";
    }

    @GetMapping({"/lien-he", "/lien-he.html", "/contact", "/contact.html"})
    public String contact() {
        return "lien-he";
    }

    @GetMapping({"/dich-vu", "/dich-vu.html", "/services", "/services.html"})
    public String services() {
        return "dich-vu";
    }
}
