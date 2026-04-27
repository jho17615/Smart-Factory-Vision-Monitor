package com.smartfactory.visionmonitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VisionMonitorApplication {

    public static void main(String[] args) {
        SpringApplication.run(VisionMonitorApplication.class, args);
        System.out.println("=========================================");
        System.out.println("  Vision Monitor API Server Started!");
        System.out.println("  Port: 8081");
        System.out.println("  Base URL: http://localhost:8081");
        System.out.println("  API Endpoints:");
        System.out.println("    - GET  /api/health");
        System.out.println("    - GET  /api/statistics/latest");
        System.out.println("    - GET  /api/statistics/ng-by-item");
        System.out.println("    - GET  /api/measurements/recent");
        System.out.println("    - POST /api/commands");
        System.out.println("=========================================");
    }
}