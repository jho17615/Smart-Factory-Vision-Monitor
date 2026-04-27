package com.smartfactory.visionmonitor.controller;

import com.smartfactory.visionmonitor.dto.LoginRequest;
import com.smartfactory.visionmonitor.dto.LoginResponse;
import com.smartfactory.visionmonitor.entity.User;
import com.smartfactory.visionmonitor.repository.UserRepository;
import com.smartfactory.visionmonitor.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    /**
     * 로그인
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            log.info("로그인 시도: {}", loginRequest.getUsername());

            // 인증
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // JWT 토큰 생성
            String jwt = tokenProvider.generateToken(authentication);

            // 사용자 정보 조회
            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            log.info("로그인 성공: {} ({})", user.getUsername(), user.getRole());

            return ResponseEntity.ok(new LoginResponse(jwt, user.getUsername(), user.getRole(), user.getFullName()));

        } catch (Exception e) {
            log.error("로그인 실패: {}", loginRequest.getUsername(), e);
            return ResponseEntity.badRequest().body("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    }

    /**
     * 현재 사용자 정보 조회
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("인증되지 않은 사용자입니다.");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(LoginResponse.builder()
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .build());
    }
}
