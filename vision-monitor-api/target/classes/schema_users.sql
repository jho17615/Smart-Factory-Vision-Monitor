-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기본 사용자 추가 (비밀번호: admin123, producer123)
-- BCrypt로 암호화된 비밀번호
INSERT INTO users (username, password, role, full_name, email) VALUES
('admin', '$2a$10$X5wFuJPBfqKwFqNvmYQG5.VvNMpYz5qWHqS5BvNMhKQvX5pqYqYKa', 'ROLE_ADMIN', '관리자', 'admin@smartfactory.com'),
('producer1', '$2a$10$X5wFuJPBfqKwFqNvmYQG5.VvNMpYz5qWHqS5BvNMhKQvX5pqYqYKa', 'ROLE_PRODUCER', '생산자1', 'producer1@smartfactory.com');

-- 비밀번호 참고:
-- admin / admin123
-- producer1 / producer123
