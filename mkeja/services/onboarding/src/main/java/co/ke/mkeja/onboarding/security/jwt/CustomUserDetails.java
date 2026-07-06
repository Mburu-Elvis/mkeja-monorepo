package co.ke.mkeja.onboarding.security.jwt;

import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetailsService {
    private final UserRepository userRepository;

   @Override
   @Transactional(readOnly = true)
    public @NonNull UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
       log.debug("Loading user by username: {}", username);

       User user =  userRepository.findByPhone(username)
               .orElseThrow(() -> new UsernameNotFoundException(
                       "User not found"
               ));

       if (!user.isActive()) {
           throw new UsernameNotFoundException("User account is inactive");
       }

       if (user.isLocked()) {
           throw new UsernameNotFoundException("User account is locked");
       }

       user.getAuthorities();
       return user;

   }

    @Transactional(readOnly = true)
    public User loadUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
    }

    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }
}
