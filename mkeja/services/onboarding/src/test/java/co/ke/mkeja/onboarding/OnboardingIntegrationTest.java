package co.ke.mkeja.onboarding;

import co.ke.mkeja.onboarding.dto.request.LandlordOnboardingRequest;
import co.ke.mkeja.onboarding.dto.request.LoginRequest;
import co.ke.mkeja.onboarding.dto.request.RegisterRequest;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.OwnerSubtype;
import co.ke.mkeja.onboarding.model.enums.OwnerType;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.model.enums.RoleScopeType;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.repository.PropertyOwnerRepository;
import co.ke.mkeja.onboarding.repository.PropertyRepository;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import co.ke.mkeja.onboarding.repository.UserRepository;
import co.ke.mkeja.onboarding.service.RoleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class OnboardingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyOwnerRepository propertyOwnerRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PropertyUnitRepository propertyUnitRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleService roleService;

    private String landlordToken;
    private Long unitId;
    private Long propertyId;

    @BeforeEach
    void setUp() throws Exception {
        User landlord = createLandlordUser();
        PropertyOwner owner = createPropertyOwner(landlord);
        Property property = createProperty(owner);
        propertyId = property.getId();
        PropertyUnit unit = createUnit(property);
        unitId = unit.getId();

        LoginRequest login = new LoginRequest();
        login.setPhone("254712345678");
        login.setPin("1234");

        landlordToken = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        landlordToken = objectMapper.readTree(landlordToken).get("access_token").asText();
    }

    @Test
    void registerAndLoginTenant() throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setFullName("Jane Akinyi");
        register.setPhone("254711111111");
        register.setRole("TENANT");
        register.setPin("5678");
        register.setConfirmPin("5678");
        register.setIdNumber("12345678");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otpRequired").value(true))
                .andExpect(jsonPath("$.challengeId").exists());
    }

    @Test
    void registerWithoutEmailAllowsMultipleUsers() throws Exception {
        RegisterRequest first = new RegisterRequest();
        first.setFullName("Jane Akinyi");
        first.setPhone("254711111111");
        first.setRole("TENANT");
        first.setPin("5678");
        first.setConfirmPin("5678");
        first.setIdNumber("12345678");

        RegisterRequest second = new RegisterRequest();
        second.setFullName("Peter Kamau");
        second.setPhone("254722222222");
        second.setRole("TENANT");
        second.setPin("5678");
        second.setConfirmPin("5678");
        second.setIdNumber("87654321");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otpRequired").value(true))
                .andExpect(jsonPath("$.challengeId").exists());
    }

    @Test
    void submitLandlordOnboarding() throws Exception {
        assertEquals(1, propertyRepository.count());

        LandlordOnboardingRequest request = new LandlordOnboardingRequest();
        request.setUserType("INDIVIDUAL_LANDLORD");
        request.setFullName("Peter Kamau");
        request.setEmail("peter@example.com");
        request.setPhone("254722222222");
        request.setIdNumber("87654321");
        request.setKraPin("A123456789X");
        request.setTerms(true);
        request.setBankAccNum("1234567890");
        request.setBankCode("01");
        request.setBankName("KCB Bank");
        request.setPin("9999");

        mockMvc.perform(post("/api/v1/onboarding/landlords")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kycStatus").value("PENDING"))
                .andExpect(jsonPath("$.applicationId").exists());

        assertEquals(1, propertyRepository.count());
    }

    @Test
    void createAndGetInvitation() throws Exception {
        String body = """
                {
                  "fullName": "Jane Tenant",
                  "phone": "254733333333",
                  "unitId": %d,
                  "monthlyRent": 5000,
                  "paymentPlan": "DAILY",
                  "leaseStartDate": "2026-07-01"
                }
                """.formatted(unitId);

        String createResponse = mockMvc.perform(post("/api/v1/invitations")
                        .header("Authorization", "Bearer " + landlordToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String code = objectMapper.readTree(createResponse).get("code").asText();

        mockMvc.perform(get("/api/v1/invitations/" + code))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.landlordName").exists())
                .andExpect(jsonPath("$.monthlyRent").value(5000));
    }

    @Test
    void tenantOnboardingFlow() throws Exception {
        String inviteBody = """
                {
                  "fullName": "Jane Tenant",
                  "phone": "254744444444",
                  "unitId": %d,
                  "monthlyRent": 5000,
                  "paymentPlan": "DAILY",
                  "leaseStartDate": "2026-07-01"
                }
                """.formatted(unitId);

        String createResponse = mockMvc.perform(post("/api/v1/invitations")
                        .header("Authorization", "Bearer " + landlordToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(inviteBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String code = objectMapper.readTree(createResponse).get("code").asText();

        String registerBody = """
                {
                  "invitationCode": "%s",
                  "fullName": "Jane Tenant",
                  "phone": "254744444444",
                  "idNumber": "11223344",
                  "idType": "NATIONAL_ID"
                }
                """.formatted(code);

        String tenantResponse = mockMvc.perform(post("/api/v1/onboarding/tenants/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").exists())
                .andExpect(jsonPath("$.walletId").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String tenantId = objectMapper.readTree(tenantResponse).get("tenantId").asText();

        MockMultipartFile idFront = new MockMultipartFile(
                "idFront", "id-front.jpg", "image/jpeg", "front-image".getBytes());
        MockMultipartFile idBack = new MockMultipartFile(
                "idBack", "id-back.jpg", "image/jpeg", "back-image".getBytes());
        MockMultipartFile selfie = new MockMultipartFile(
                "selfie", "selfie.jpg", "image/jpeg", "selfie-image".getBytes());

        mockMvc.perform(multipart("/api/v1/onboarding/tenants/" + tenantId + "/documents")
                        .file(idFront)
                        .file(idBack)
                        .file(selfie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kycStatus").value("MANUAL_REVIEW"))
                .andExpect(jsonPath("$.documentsUploaded.length()").value(3));

        String adminLogin = """
                {"phone":"254799999999","pin":"0000"}
                """;
        String adminToken = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminLogin))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        adminToken = objectMapper.readTree(adminToken).get("access_token").asText();

        mockMvc.perform(post("/api/v1/admin/kyc-queue/" + tenantId + "/approve")
                        .param("type", "TENANT")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/onboarding/tenants/" + tenantId + "/lease/sign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"invitationCode\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenancyId").exists());

        mockMvc.perform(post("/api/v1/onboarding/tenants/" + tenantId + "/payment-plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plan\":\"DAILY\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/onboarding/tenants/" + tenantId + "/ratiba")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plan\":\"DAILY\",\"amount\":167}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void scopedAgentCanAccessAssignedProperty() throws Exception {
        User agent = new User();
        agent.setPhone("254755555555");
        agent.setEmail("agent@example.com");
        agent.setFirstName("Mary");
        agent.setLastName("Agent");
        agent.setPasswordHash(passwordEncoder.encode("5678"));
        agent.setPasswordChangedAt(LocalDateTime.now());
        agent.setOtpVerified(true);
        agent.setCreatedBy("test");
        agent.setUpdatedBy("test");
        roleService.grantScopedRole(agent, RoleName.AGENT, RoleScopeType.PROPERTY,
                String.valueOf(propertyId), "test");
        agent = userRepository.save(agent);

        LoginRequest login = new LoginRequest();
        login.setPhone("254755555555");
        login.setPin("5678");
        String agentToken = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()).get("access_token").asText();

        mockMvc.perform(get("/api/v1/properties/" + propertyId)
                        .header("Authorization", "Bearer " + agentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Kimathi Apartments"));

        String inviteBody = """
                {
                  "fullName": "Scoped Tenant",
                  "phone": "254766666666",
                  "unitId": %d,
                  "monthlyRent": 5000,
                  "paymentPlan": "DAILY",
                  "leaseStartDate": "2026-07-01"
                }
                """.formatted(unitId);

        mockMvc.perform(post("/api/v1/invitations")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(inviteBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").exists());
    }

    private User createLandlordUser() {
        User user = new User();
        user.setPhone("254712345678");
        user.setEmail("landlord@example.com");
        user.setFirstName("John");
        user.setLastName("Otieno");
        user.setPasswordHash(passwordEncoder.encode("1234"));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setOtpVerified(true);
        user.setCreatedBy("test");
        user.setUpdatedBy("test");
        roleService.grantRole(user, RoleName.PROPERTY_OWNER, "test");
        return userRepository.save(user);
    }

    private PropertyOwner createPropertyOwner(User user) {
        PropertyOwner owner = new PropertyOwner();
        owner.setUser(user);
        owner.setOwnerType(OwnerType.INDIVIDUAL);
        owner.setOwnerSubtype(OwnerSubtype.INDIVIDUAL);
        owner.setNationalId("12345678");
        owner.setKycStatus(KycStatus.APPROVED);
        return propertyOwnerRepository.save(owner);
    }

    private Property createProperty(PropertyOwner owner) {
        Property property = new Property();
        property.setOwner(owner);
        property.setName("Kimathi Apartments");
        property.setAddress("Kimathi Street");
        property.setTotalUnits(4);
        property.setCity("Nairobi");
        property.setCounty("Nairobi");
        return propertyRepository.save(property);
    }

    @Test
    void profileMeReturnsAuthenticatedUserDetails() throws Exception {
        mockMvc.perform(get("/api/v1/profile/me")
                        .header("Authorization", "Bearer " + landlordToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.fullName").exists())
                .andExpect(jsonPath("$.role").value("LANDLORD"))
                .andExpect(jsonPath("$.kycDocuments").isArray());
    }

    private PropertyUnit createUnit(Property property) {
        PropertyUnit unit = new PropertyUnit();
        unit.setProperty(property);
        unit.setUnitNumber("A1");
        unit.setRent(5000.0);
        unit.setDeposit(5000.0);
        unit.setStatus(UnitStatus.VACANT);
        return propertyUnitRepository.save(unit);
    }
}
