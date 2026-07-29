package com.smartbilling.controller;

import com.smartbilling.entity.Product;
import com.smartbilling.repository.CustomerRepository;
import com.smartbilling.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long productsCount = productRepository.count();
        long customersCount = customerRepository.count();

        List<Product> products = productRepository.findAll();
        double inventoryValue = products.stream()
                .mapToDouble(p -> (p.getPrice() != null ? p.getPrice().doubleValue() : 0.0) * (p.getStock() != null ? p.getStock() : 0))
                .sum();

        long lowStockCount = products.stream()
                .filter(p -> p.getStock() != null && p.getLowStockThreshold() != null && p.getStock() <= p.getLowStockThreshold())
                .count();

        return ResponseEntity.ok(Map.of(
                "products", productsCount,
                "customers", customersCount,
                "inventoryValue", inventoryValue,
                "lowStockCount", lowStockCount
        ));
    }
}
