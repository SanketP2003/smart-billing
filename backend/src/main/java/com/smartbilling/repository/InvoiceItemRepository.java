package com.smartbilling.repository;

import com.smartbilling.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID> {
}
