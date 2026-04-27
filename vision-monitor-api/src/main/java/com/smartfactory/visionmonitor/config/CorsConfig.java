package com.smartfactory.visionmonitor.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")  // 모든 도메인 허용 (개발용)
                // 또는 특정 IP만 허용하려면:
                // .allowedOrigins(
                //     "http://localhost:5173",
                //     "http://localhost:3000",
                //     "http://127.0.0.1:5173",
                //     "http://127.0.0.1:3000",
                //     "http://192.168.0.5:3000",
                //     "http://192.168.1.x:3000",  // ← 모바일 IP 추가
                //     "http://192.168.0.x:3000"   // ← 모바일 IP 추가
                // )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)  // credentials 사용 안 함으로 변경
                .maxAge(3600);
    }
}