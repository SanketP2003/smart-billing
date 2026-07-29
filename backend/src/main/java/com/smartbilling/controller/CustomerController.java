package com.smartbilling.controller;

import com.smartbilling.entity.Customer;
import com.smartbilling.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping
    public List<Customer> getCustomers() {
        return customerRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerById(@PathVariable UUID id) {
        return customerRepository.findById(id)
                .map(customer -> ResponseEntity.ok((Object) customer))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Customer not found")));
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@Valid @RequestBody Customer customer) {
        try {
            if (customer.getEmail() != null && !customer.getEmail().isBlank()) {
                if (customerRepository.findByEmail(customer.getEmail()).isPresent()) {
                    return ResponseEntity.status(409)
                            .body(Map.of("error", "A customer with this email already exists"));
                }
            }
            Customer saved = customerRepository.save(customer);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to create customer: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable UUID id, @Valid @RequestBody Customer customerDetails) {
        return customerRepository.findById(id).map(customer -> {
            customer.setName(customerDetails.getName());
            customer.setEmail(customerDetails.getEmail());
            customer.setPhone(customerDetails.getPhone());
            customer.setAddress(customerDetails.getAddress());
            customer.setGstNumber(customerDetails.getGstNumber());
            customer.setStateCode(customerDetails.getStateCode());
            return ResponseEntity.ok((Object) customerRepository.save(customer));
        }).orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Customer not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable UUID id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Customer not found"));
        }
        customerRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
