package com.smartbilling.component;

import com.smartbilling.entity.User;
import com.smartbilling.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@smartbilling.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@smartbilling.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .name("Admin")
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Default Admin user created (admin@smartbilling.com / Admin@123)");
        }

        if (userRepository.findByEmail("manager@smartbilling.com").isEmpty()) {
            User manager = User.builder()
                    .email("manager@smartbilling.com")
                    .password(passwordEncoder.encode("Manager@123"))
                    .name("Manager")
                    .role(User.Role.MANAGER)
                    .build();
            userRepository.save(manager);
            System.out.println("✅ Default Manager user created (manager@smartbilling.com / Manager@123)");
        }
    }
}
