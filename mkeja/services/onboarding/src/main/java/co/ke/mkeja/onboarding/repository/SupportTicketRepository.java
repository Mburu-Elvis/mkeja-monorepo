package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.SupportTicket;
import co.ke.mkeja.onboarding.model.enums.SupportRoutingTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    @Query("""
            SELECT t FROM SupportTicket t
            LEFT JOIN FETCH t.messages
            WHERE t.user.id = :userId AND t.deletedAt IS NULL
            ORDER BY t.updatedAt DESC
            """)
    List<SupportTicket> findByUserIdWithMessages(@Param("userId") Long userId);

    @Query("""
            SELECT t FROM SupportTicket t
            LEFT JOIN FETCH t.messages
            WHERE t.assignedUser.id = :userId AND t.deletedAt IS NULL
            ORDER BY t.updatedAt DESC
            """)
    List<SupportTicket> findInboxByAssignedUserId(@Param("userId") Long userId);

    @Query("""
            SELECT t FROM SupportTicket t
            LEFT JOIN FETCH t.messages
            WHERE t.routingTarget = :routingTarget AND t.deletedAt IS NULL
            ORDER BY t.updatedAt DESC
            """)
    List<SupportTicket> findPlatformTickets(@Param("routingTarget") SupportRoutingTarget routingTarget);

    @Query("""
            SELECT t FROM SupportTicket t
            LEFT JOIN FETCH t.messages
            WHERE t.id = :ticketId AND t.deletedAt IS NULL
            """)
    Optional<SupportTicket> findByIdWithMessages(@Param("ticketId") Long ticketId);

    @Query("""
            SELECT t FROM SupportTicket t
            LEFT JOIN FETCH t.messages
            WHERE t.id = :ticketId
              AND t.deletedAt IS NULL
              AND (t.user.id = :userId OR t.assignedUser.id = :userId)
            """)
    Optional<SupportTicket> findAccessibleByUser(@Param("ticketId") Long ticketId, @Param("userId") Long userId);

    @Query("""
            SELECT t FROM SupportTicket t
            LEFT JOIN FETCH t.messages
            WHERE t.id = :ticketId
              AND t.deletedAt IS NULL
              AND (t.user.id = :userId OR t.assignedUser.id = :userId OR t.routingTarget = :platformTarget)
            """)
    Optional<SupportTicket> findAccessibleIncludingPlatform(
            @Param("ticketId") Long ticketId,
            @Param("userId") Long userId,
            @Param("platformTarget") SupportRoutingTarget platformTarget);

    boolean existsByReferenceCode(String referenceCode);
}
