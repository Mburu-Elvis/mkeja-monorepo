package co.ke.mkeja.onboarding.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_bank_accounts")
public class BankAccount extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "property_owner_id", nullable = false)
    private PropertyOwner propertyOwner;

    @Column(name = "bank_code", nullable = false, length = 10)
    private String bankCode;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Column(name = "account_number", nullable = false, length = 20)
    private String accountNumber;

    @Column(name = "branch")
    private String branch;
}
