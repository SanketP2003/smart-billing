package com.smartbilling.controller;

import com.smartbilling.entity.Customer;
import com.smartbilling.entity.Invoice;
import com.smartbilling.entity.InvoiceItem;
import com.smartbilling.repository.CustomerRepository;
import com.smartbilling.repository.InvoiceRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Data
    public static class InvoiceItemDto {
        private UUID productId;
        private String productName;
        private String hsnSacCode;
        @NotNull private Integer quantity;
        @NotNull private BigDecimal unitPrice;
        private BigDecimal taxRate;
        private BigDecimal discountAmount;
    }

    @Data
    public static class InvoiceRequest {
        @NotNull private UUID customerId;
        private String couponCode;
        private BigDecimal discountAmount;
        @NotNull private List<InvoiceItemDto> items;
    }

    @GetMapping
    @Transactional
    public List<Invoice> getInvoices() {
        return invoiceRepository.findAll();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createInvoice(@Valid @RequestBody InvoiceRequest req) {
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + System.currentTimeMillis())
                .customer(customer)
                .invoiceDate(LocalDateTime.now())
                .dueDate(LocalDateTime.now().plusDays(30))
                .couponCode(req.getCouponCode())
                .discountAmount(req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO)
                .paymentStatus(Invoice.PaymentStatus.UNPAID)
                .status(Invoice.InvoiceStatus.ISSUED)
                .build();

        for (InvoiceItemDto itemDto : req.getItems()) {
            BigDecimal qty = new BigDecimal(itemDto.getQuantity());
            BigDecimal itemSubtotal = itemDto.getUnitPrice().multiply(qty);
            
            BigDecimal rate = itemDto.getTaxRate() != null ? itemDto.getTaxRate() : BigDecimal.ZERO;
            BigDecimal itemTax = itemSubtotal.multiply(rate).divide(new BigDecimal("100"));

            subtotal = subtotal.add(itemSubtotal);
            totalTax = totalTax.add(itemTax);

            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .productName(itemDto.getProductName())
                    .hsnSacCode(itemDto.getHsnSacCode())
                    .quantity(itemDto.getQuantity())
                    .unitPrice(itemDto.getUnitPrice())
                    .taxRate(rate)
                    .taxAmount(itemTax)
                    .discountAmount(itemDto.getDiscountAmount() != null ? itemDto.getDiscountAmount() : BigDecimal.ZERO)
                    .totalPrice(itemSubtotal.add(itemTax))
                    .build();

            invoice.getItems().add(item);
        }

        invoice.setSubtotal(subtotal);
        invoice.setTotalTax(totalTax);
        
        BigDecimal total = subtotal.add(totalTax).subtract(invoice.getDiscountAmount());
        invoice.setTotalAmount(total);
        invoice.setAmountDue(total);
        invoice.setAmountPaid(BigDecimal.ZERO);

        Invoice saved = invoiceRepository.save(invoice);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<?> getInvoice(@PathVariable UUID id) {
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteInvoice(@PathVariable UUID id) {
        invoiceRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
