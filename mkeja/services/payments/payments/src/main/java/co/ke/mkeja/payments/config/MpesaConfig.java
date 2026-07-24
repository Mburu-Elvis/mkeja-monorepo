package co.ke.mkeja.payments.config;

import io.github.kathukyabrian.core.ServiceRepository;
import io.github.kathukyabrian.core.factory.ServiceRepositoryFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class MpesaConfig {
    private ServiceRepository serviceRepository;

    @Bean
    public ServiceRepository getServiceRepository() {
        if(serviceRepository == null){
            serviceRepository = ServiceRepositoryFactory.getServiceRepository();
        }
        return serviceRepository;
    }

    public ServiceRepository getInstance() {
        return this.serviceRepository;
    }
}