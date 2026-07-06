package co.ke.mkeja.onboarding.util;

public final class UserFieldNormalizer {

    private UserFieldNormalizer() {}

    public static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    public static String normalizePhone(String phone) {
        String cleaned = phone.replaceAll("\\D", "");
        if (cleaned.startsWith("0")) {
            cleaned = "254" + cleaned.substring(1);
        } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
            cleaned = "254" + cleaned;
        }
        return cleaned;
    }
}
