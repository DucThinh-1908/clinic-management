package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.AuthDtos.*;
import com.clinic.clinic_management.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        LoginResponse response = authService.login(request, ipAddress);
        if (!response.isSuccess()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", response.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestParam(required = false) Long userId, HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        authService.logout(userId, ipAddress);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Đăng xuất thành công");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        String result = authService.changePassword(request, ipAddress);
        Map<String, Object> res = new HashMap<>();
        if ("SUCCESS".equals(result)) {
            res.put("success", true);
            res.put("message", "Đổi mật khẩu thành công");
            return ResponseEntity.ok(res);
        } else {
            res.put("success", false);
            res.put("message", result);
            return ResponseEntity.badRequest().body(res);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request, HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        String resultOrToken = authService.forgotPassword(request, ipAddress);
        Map<String, Object> res = new HashMap<>();
        if (resultOrToken.length() == 8) {
            res.put("success", true);
            res.put("message", "Mã xác thực đã được gửi");
            res.put("resetToken", resultOrToken); // For convenience in testing/demo
            return ResponseEntity.ok(res);
        } else {
            res.put("success", false);
            res.put("message", resultOrToken);
            return ResponseEntity.badRequest().body(res);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request, HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        String result = authService.resetPassword(request, ipAddress);
        Map<String, Object> res = new HashMap<>();
        if ("SUCCESS".equals(result)) {
            res.put("success", true);
            res.put("message", "Đặt lại mật khẩu thành công. Quý khách có thể đăng nhập bằng mật khẩu mới.");
            return ResponseEntity.ok(res);
        } else {
            res.put("success", false);
            res.put("message", result);
            return ResponseEntity.badRequest().body(res);
        }
    }
}
