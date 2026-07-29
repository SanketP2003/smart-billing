package com.smartbilling.controller;

import com.smartbilling.entity.User;
import com.smartbilling.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Erase passwords before sending to the frontend
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");
        String role = body.get("role");

        if (email == null || password == null || name == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("error", "Email already exists"));
        }

        if (!role.equals("ADMIN") && !role.equals("MANAGER") && !role.equals("CASHIER")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role specified"));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setRole(User.Role.valueOf(role));

        userRepository.save(user);
        
        user.setPassword(null); // Don't return password
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<User> userOpt = userRepository.findById(UUID.fromString(id));
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        User user = userOpt.get();
        
        if (body.containsKey("name")) {
            user.setName(body.get("name"));
        }
        
        if (body.containsKey("email")) {
            String newEmail = body.get("email");
            Optional<User> existingUser = userRepository.findByEmail(newEmail);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                return ResponseEntity.status(400).body(Map.of("error", "Email already in use"));
            }
            user.setEmail(newEmail);
        }
        
        if (body.containsKey("role")) {
            String role = body.get("role");
            if (!role.equals("ADMIN") && !role.equals("MANAGER") && !role.equals("CASHIER")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid role specified"));
            }
            user.setRole(User.Role.valueOf(role));
        }
        
        if (body.containsKey("password") && !body.get("password").isEmpty()) {
            user.setPassword(passwordEncoder.encode(body.get("password")));
        }
        
        userRepository.save(user);
        user.setPassword(null);
        
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        Optional<User> userOpt = userRepository.findById(UUID.fromString(id));
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        // Prevent admin from deleting themselves? Let's just allow it or rely on client side to hide the delete button for self.
        
        userRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
