package com.smartfactory.visionmonitor.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")  // 모든 도메인 허용
public class ApiController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.info("GET /api/health - 헬스 체크 요청");
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Vision Monitor API");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/commands")
    public ResponseEntity<Map<String, Object>> sendCommand(@RequestBody Map<String, Object> command) {
        String commandType = (String) command.get("commandType");
        Object parameters = command.get("parameters");

        log.info("POST /api/commands - 명령 수신: {}", commandType);
        log.info("파라미터: {}", parameters);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "명령이 성공적으로 전송되었습니다.");
        response.put("timestamp", java.time.LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }
}