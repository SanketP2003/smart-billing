package com.smartbilling.controller;

import com.smartbilling.entity.Product;
import com.smartbilling.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable UUID id) {
        return productRepository.findById(id)
                .map(product -> ResponseEntity.ok((Object) product))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Product not found")));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        try {
            if (product.getSku() != null && !product.getSku().isBlank()) {
                if (productRepository.findBySku(product.getSku()).isPresent()) {
                    return ResponseEntity.status(409)
                            .body(Map.of("error", "A product with SKU '" + product.getSku() + "' already exists"));
                }
            }
            Product saved = productRepository.save(product);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create product: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateProduct(@PathVariable UUID id, @Valid @RequestBody Product productDetails) {
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setSku(productDetails.getSku());
            product.setHsnSacCode(productDetails.getHsnSacCode());
            product.setCategory(productDetails.getCategory());
            product.setPrice(productDetails.getPrice());
            product.setStock(productDetails.getStock());
            product.setGstRate(productDetails.getGstRate());
            product.setLowStockThreshold(productDetails.getLowStockThreshold());
            return ResponseEntity.ok((Object) productRepository.save(product));
        }).orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Product not found")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProduct(@PathVariable UUID id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Product not found"));
        }
        productRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
